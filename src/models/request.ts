import { ObjectId, WithId } from "mongodb";
import { DateRange } from "./carer.js";
import { Owner } from "./owner.js";
import { carerCollection, ownerCollection } from "../mongo.js";
import { PetSize, PetType, getPetWithId } from "./pet.js";

type RequestStatus = "pending" | "accepted" | "rejected" | "completed";

export interface Request {
  _id: ObjectId;
  carer: ObjectId | null;
  status: RequestStatus;
  pets: ObjectId[];
  respondents: ObjectId[];
  requestedOn: Date;
  dateRange: DateRange;
  additionalInfo?: string;
}

export async function getRequestWithId(requestId: ObjectId) {
  const res = await ownerCollection.aggregate([
    { $unwind: "$requests" },
    { $match: { "requests._id": requestId } },
  ]);
  const request = await res.next();
  return request?.requests as Request;
}

export async function getOwnerRequests(owner: WithId<Owner>) {
  const res = await ownerCollection.aggregate([
    { $match: { _id: owner._id } },
    { $unwind: "$requests" },
    // add location information into each request
    {
      $addFields: {
        "requests.location": {
          state: "$location.state",
          city: "$location.city",
          street: "$location.street",
        },
      },
    },
    { $replaceWith: "$requests" },
    // add some of the carers info onto the request by joining their information
    // if the carer id is present in the request
    {
      $lookup: {
        from: "users",
        let: { carer: "$carer" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", { $toObjectId: "$$carer" }] },
            },
          },

          { $project: { _id: 1, name: 1 } },
        ],
        as: "carer",
      },
    },
    // add some of the pet info back into the request
    {
      $lookup: {
        from: "users",
        let: { pets: "$pets" },
        pipeline: [
          {
            $match: { _id: owner._id },
          },
          { $unwind: "$pets" },
          { $replaceWith: "$pets" },
          { $match: { $expr: { $in: ["$_id", "$$pets"] } } },
          { $project: { _id: 1, name: 1, petType: 1 } },
        ],
        as: "pets",
      },
    },
    // flatten the carer array if it is present
    { $unwind: { path: "$carer", preserveNullAndEmptyArrays: true } },
    { $project: { carerInfo: 0 } },
  ]);

  return await res.toArray();
}

async function addRequestToCarer(requestId: ObjectId, carerId: ObjectId) {
  return await carerCollection.updateOne(
    { _id: carerId },
    {
      $push: {
        offers: {
          requestId: requestId,
          offerType: "direct",
          status: "pending",
        },
      },
    }
  );
}

async function addRequestToNearby(owner: WithId<Owner>, request: Request) {
  // query all the nearby carers and get a list of their object id's
  const res = await ownerCollection.aggregate([
    { $unwind: "$requests" },
    { $match: { "requests._id": request._id } },
    {
      $lookup: {
        from: "users",
        let: { pt: "$location" },
        pipeline: [
          {
            $geoNear: {
              near: "$$pt",
              distanceField: "distance",
              maxDistance: 100 * 1000, // keep the query within 100km as a hard maximum
              spherical: true,
            },
          },
          {
            $match: {
              userType: "carer",
              $expr: { $lt: ["$distance", "$preferredTravelDistance"] },
            },
          },
        ],
        as: "nearby",
      },
    },
    { $unwind: "$nearby" },
    { $replaceWith: "$nearby" },
    { $project: { _id: 1 } },
  ]);

  // map the nearby query to an array of carer _id's
  const nearby = (await res.toArray()).map((n) => n._id) as ObjectId[];

  // add the request to all the nearby carers
  return await carerCollection.updateMany(
    { _id: { $in: nearby } },
    {
      $push: {
        offers: {
          requestId: request._id,
          offerType: "broad",
          status: "pending",
        },
      },
    }
  );
}

export async function createNewRequest(owner: WithId<Owner>, request: Request) {
  request._id = new ObjectId();
  await ownerCollection.updateOne(
    { _id: owner._id },
    { $push: { requests: request } }
  );

  return request.carer
    ? await addRequestToCarer(request._id, request.carer)
    : await addRequestToNearby(owner, request);
}

export async function updateRequest(owner: WithId<Owner>, request: Request) {
  await ownerCollection.updateOne(
    { _id: owner._id, "requests._id": request._id },
    { $set: { "requests.$": request } }
  );

  return await getRequestWithId(request._id);
}

export async function getRespondents(
  owner: WithId<Owner>,
  requestId: ObjectId
) {
  const res = await ownerCollection.aggregate([
    { $match: { _id: owner._id } },
    { $unwind: "$requests" },
    { $match: { "requests._id": requestId } },
    { $replaceWith: "$requests" },
    // todo, include avg of carer ratings in the result
    {
      $lookup: {
        from: "users",
        localField: "respondents",
        foreignField: "_id",
        as: "respondents",
      },
    },
    { $unwind: "$respondents" },
    { $replaceWith: "$respondents" },
    {
      $project: {
        _id: 1,
        name: 1,
        bio: 1,
        rating: { $avg: "$feedback.rating" },
      },
    },
  ]);

  return res.toArray();
}

export async function acceptRequestRespondent(
  owner: WithId<Owner>,
  requestId: ObjectId,
  respondentId: ObjectId
) {
  // update the requests carer to the selected respondent and status to accepted
  const res = await ownerCollection.updateOne(
    {
      _id: owner._id,
      requests: {
        $elemMatch: {
          _id: requestId,
          respondents: respondentId,
        },
      },
    },
    {
      $set: {
        "requests.$.carer": respondentId,
        "requests.$.status": "accepted",
      },
    }
  );

  // return early if nothing matched
  if (res.matchedCount == 0) return res;

  // move the request from offers to the jobs list of the carer
  return await carerCollection.updateOne(
    { _id: respondentId, "offers.requestId": requestId },
    { $set: { "offers.$.status": "accepted" } }
  );
}

// TODO add carer rating and availability date range
export interface SearchQuery {
  price?: number;
  rating?: number;
  petTypes?: PetType[];
  petSizes?: PetSize[];
}

export async function findNearbyRequests(owner: WithId<Owner>) {
  // query all the nearby carers and get a list of their object id's
  const res = await carerCollection.aggregate([
    // filter the carers that are nearby
    {
      $geoNear: {
        near: owner.location,
        distanceField: "distance",
        maxDistance: 100 * 1000, // keep the query within 100km as a hard maximum
        query: {
          userType: "carer",
        },
        herical: true,
      },
    },
    // filter only carers within their preferredTravelDistance
    { $match: { $expr: { $lt: ["$distance", "$preferredTravelDistance"] } } },
    {
      $project: {
        _id: 1,
        name: 1,
        bio: 1,
        pfp: 1,
        rating: { $avg: "$feedback.rating" },
      },
    },
  ]);

  return await res.toArray();
}

export async function getRequestPets(requestId: ObjectId) {
  const request = await getRequestWithId(new ObjectId(requestId));

  return await Promise.all(
    request.pets.map(async (petId) => {
      return await getPetWithId(new ObjectId(petId));
    })
  );
}
