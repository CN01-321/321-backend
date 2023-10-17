/**
 * @file Declares the Request interfaces and model functions
 * @author George Bull
 */

import { ObjectId, UpdateResult, WithId } from "mongodb";
import { Carer, DateRange } from "./carer.js";
import { Owner } from "./owner.js";
import { carerCollection, ownerCollection } from "../mongo.js";
import { PetDTO, PetSize, PetType } from "./pet.js";
import { User, UserLocation } from "./user.js";

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
interface RequestDTO {
  _id: ObjectId;
  carer: { _id: ObjectId; name: string } | null;
  status: RequestStatus;
  pets: Array<{
    _id: ObjectId;
    name: string;
    petType: PetType;
    pfp?: string;
  }>;
  location: {
    state: string;
    city: string;
    street: string;
  };
  respondents: ObjectId[];
  requestedOn: Date;
  dateRange: DateRange;
  additionalInfo?: string;
}

export async function getRequestWithId(
  owner: WithId<Owner>,
  requestId: ObjectId
): Promise<RequestDTO> {
  const res = await ownerCollection.aggregate([
    { $match: { _id: owner._id } },
    { $unwind: "$requests" },
    { $match: { "requests._id": requestId } },
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
    // add pet information
    {
      $set: {
        "requests.pets": {
          $filter: {
            input: "$pets",
            as: "pet",
            cond: { $in: ["$$pet._id", "$requests.pets"] },
          },
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
    // flatten the carer array if it is present
    { $unwind: { path: "$carer", preserveNullAndEmptyArrays: true } },
    { $project: { carerInfo: 0, "pets.feedback": 0 } },
  ]);

  return (await res.next()) as RequestDTO;
}

export async function getOwnerRequests(
  owner: WithId<Owner>
): Promise<RequestDTO[]> {
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
    // add pet information to each request
    {
      $set: {
        "requests.pets": {
          $filter: {
            input: "$pets",
            as: "pet",
            cond: { $in: ["$$pet._id", "$requests.pets"] },
          },
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
    // flatten the carer array if it is present
    { $unwind: { path: "$carer", preserveNullAndEmptyArrays: true } },
    { $project: { carerInfo: 0, "pet.feedback": 0 } },
  ]);

  return (await res.toArray()) as RequestDTO[];
}

async function addRequestToCarer(
  requestId: ObjectId,
  carerId: ObjectId
): Promise<UpdateResult<Carer>> {
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

async function addRequestToNearby(
  owner: WithId<Owner> & { location: UserLocation },
  request: Request
) {
  const nearbyIds = await carerCollection.aggregate([
    {
      $geoNear: {
        near: owner.location,
        distanceField: "distance",
        maxDistance: 100 * 1000, // keep the query within 100km as a hard maximum
        query: { userType: "carer" },
        spherical: true,
      },
    },
    {
      $match: {
        $expr: { $lt: ["$distance", "$preferredTravelDistance"] },
      },
    },
  ]);

  for await (const nearby of nearbyIds) {
    await carerCollection.updateOne(
      { _id: nearby._id },
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
}

export async function createNewRequest(
  owner: WithId<Owner> & { location: UserLocation },
  request: Request
): Promise<UpdateResult<User> | void> {
  request._id = new ObjectId();
  const res = await ownerCollection.updateOne(
    { _id: owner._id },
    { $push: { requests: request } }
  );

  if (!res.matchedCount) {
    return res;
  }

  // if carer is specified then send the request to them directly,
  // else send the request to nearby carers
  return request.carer
    ? await addRequestToCarer(request._id, request.carer)
    : await addRequestToNearby(owner, request);
}

export async function updateRequest(
  owner: WithId<Owner>,
  request: Request
): Promise<RequestDTO> {
  await ownerCollection.updateOne(
    { _id: owner._id, "requests._id": request._id },
    { $set: { "requests.$": request } }
  );

  return await getRequestWithId(owner, request._id);
}

interface RespondentDTO {
  _id: ObjectId;
  name: string;
  pfp?: string;
  bio?: string;
  rating?: number;
  totalReviews: number;
  hourlyRate: number;
}

export async function getRespondents(
  owner: WithId<Owner>,
  requestId: ObjectId
): Promise<RespondentDTO[]> {
  const res = await ownerCollection.aggregate([
    { $match: { _id: owner._id } },
    { $unwind: "$requests" },
    { $match: { "requests._id": requestId } },
    { $replaceWith: "$requests" },
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
        pfp: 1,
        bio: 1,
        rating: { $avg: "$feedback.rating" },
        totalReviews: { $size: "$feedback" },
        hourlyRate: 1,
      },
    },
  ]);

  return (await res.toArray()) as RespondentDTO[];
}

export async function acceptRequestRespondent(
  owner: WithId<Owner>,
  requestId: ObjectId,
  respondentId: ObjectId
): Promise<UpdateResult<User>> {
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

interface NearbyCarerDTO {
  _id: ObjectId;
  name: string;
  bio?: string;
  pfp?: string;
  rating?: number;
  distance: number;
  totalReviews: number;
  hourlyRate: number;
  preferredPetTypes: PetType[];
  preferredPetSizes: PetSize[];
}

export async function findNearbyCarers(
  owner: WithId<Owner>
): Promise<NearbyCarerDTO[]> {
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
        spherical: true,
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
        distance: 1,
        totalReviews: { $size: "$feedback" },
        hourlyRate: 1,
        preferredPetTypes: 1,
        preferredPetSizes: 1,
      },
    },
  ]);

  return (await res.toArray()) as NearbyCarerDTO[];
}

export async function getRequestPets(requestId: ObjectId): Promise<PetDTO[]> {
  const res = await ownerCollection.aggregate([
    { $match: { "requests._id": requestId } },
    { $unwind: "$requests" },
    { $match: { "requests._id": requestId } },
    {
      $set: {
        pets: {
          $filter: {
            input: "$pets",
            as: "pet",
            cond: {
              $in: ["$$pet._id", "$requests.pets"],
            },
          },
        },
      },
    },
    { $unwind: "$pets" },
    { $replaceWith: "$pets" },
    { $project: { feedback: 0 } },
  ]);

  return (await res.toArray()) as PetDTO[];
}
