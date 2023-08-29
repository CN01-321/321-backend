import { ObjectId, WithId } from "mongodb";
import { PetSize, PetType, petSizes, petTypes } from "./pet.js";
import { User, UserLocation } from "./user.js";
import { carerCollection, ownerCollection } from "../mongo.js";

const DEFAULT_TRAVEL_DISTANCE_METRES = 50000;
const DEFAULT_HOURLY_RATE = 20;

export interface Carer extends User {
  skillsAndExp?: string;
  preferredTravelDistance: number; // distance is in metres
  hourlyRate: number;
  offers: Offer[];
  preferredPetTypes: PetType[];
  preferredPetSizes: PetSize[];
}

export type OfferType = "broad" | "direct";

interface Offer {
  requestId: ObjectId;
  offerType: OfferType;
  status: "pending" | "applied" | "accepted";
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Licence {
  name: string;
  number: string;
}

export async function newCarer(email: string, password: string) {
  return carerCollection.insertOne({
    _id: new ObjectId(),
    email,
    password,
    userType: "carer",
    notifications: [],
    preferredTravelDistance: DEFAULT_TRAVEL_DISTANCE_METRES,
    hourlyRate: DEFAULT_HOURLY_RATE,
    feedback: [],
    offers: [],
    preferredPetTypes: petTypes, // preferr all pet types and sizes by default
    preferredPetSizes: petSizes,
  });
}

export async function carerExists(carerId: ObjectId) {
  return (
    (await ownerCollection.findOne({ _id: carerId, userType: "carer" })) != null
  );
}

export async function getCarerById(carerId: ObjectId) {
  return carerCollection.findOne(
    { _id: carerId },
    {
      projection: {
        _id: 1,
        email: 1,
        userType: 1,
        pfp: 1,
        preferredTravelDistance: 1,
        hourlyRate: 1,
        unavailabilities: 1,
        preferredPetTypes: 1,
        preferredPetSizes: 1,
      },
    }
  );
}

export async function getCarerByEmail(email: string) {
  return carerCollection.findOne({ email, userType: "carer" });
}

export async function updateCarerDetails(
  carerId: ObjectId,
  carer: Omit<Partial<Carer>, "_id">
) {
  return await carerCollection.updateOne(
    { _id: new ObjectId(carerId) },
    { $set: carer }
  );
}

export async function getCarerOffers(
  carer: WithId<Carer>,
  offerType: OfferType
) {
  const res = await carerCollection.aggregate([
    { $match: { _id: carer._id } },
    { $unwind: "$offers" },
    { $replaceWith: "$offers" },
    { $match: { offerType, status: { $in: ["pending", "applied"] } } },
    {
      $lookup: {
        from: "users",
        let: { offer: "$requestId", status: "$status" },
        pipeline: [
          { $unwind: "$requests" },
          {
            $match: {
              $expr: {
                $eq: ["$requests._id", "$$offer"],
              },
            },
          },
          {
            $set: {
              "requests.ownerId": "$_id",
              "requests.ownerName": "$name",
              "requests.ownerIcon": "$pfp",
              "requests.location": "$location",
            },
          },
          { $replaceWith: "$requests" },
          {
            $project: {
              _id: 1,
              ownerId: 1,
              ownerName: 1,
              ownerIcon: 1,
              pets: 1,
              dateRange: 1,
              location: 1,
              requestedOn: 1,
              status: "$$status",
            },
          },
        ],
        as: "offers",
      },
    },

    { $unwind: "$offers" },
    { $replaceWith: "$offers" },
    // get basic pet information for each offer
    {
      $lookup: {
        from: "users",
        let: { pets: "$pets" },
        pipeline: [
          { $unwind: "$pets" },
          { $replaceWith: "$pets" },
          {
            $match: {
              $expr: { $in: ["$_id", "$$pets"] },
            },
          },
          { $project: { _id: 1, name: 1, petType: 1 } },
        ],
        as: "pets",
      },
    },
  ]);

  return await res.toArray();
}

export async function getCarerJobs(carer: WithId<Carer>) {
  const res = await carerCollection.aggregate([
    { $match: { _id: carer._id } },
    { $unwind: "$offers" },
    { $replaceWith: "$offers" },
    { $match: { status: "accepted" } },
    {
      $lookup: {
        from: "users",
        let: { job: "$requestId", status: "$status" },
        pipeline: [
          { $unwind: "$requests" },
          {
            $match: {
              $expr: {
                $eq: ["$requests._id", "$$job"],
              },
            },
          },
          {
            $set: {
              "requests.ownerId": "$_id",
              "requests.ownerName": "$name",
              "requests.location": "$location",
            },
          },
          { $replaceWith: "$requests" },
          {
            $project: {
              _id: 1,
              ownerId: 1,
              ownerName: 1,
              pets: 1,
              dateRange: 1,
              location: 1,
              requestedOn: 1,
              additionalInfo: 1,
              status: "$$status",
            },
          },
        ],
        as: "jobs",
      },
    },

    { $unwind: "$jobs" },
    { $replaceWith: "$jobs" },
    // get basic pet information for each offer
    {
      $lookup: {
        from: "users",
        let: { pets: "$pets" },
        pipeline: [
          { $unwind: "$pets" },
          { $replaceWith: "$pets" },
          {
            $match: {
              $expr: { $in: ["$_id", "$$pets"] },
            },
          },
          { $project: { _id: 1, name: 1, petType: 1 } },
        ],
        as: "pets",
      },
    },
  ]);

  return await res.toArray();
}

// accept broad offer places the carer's id onto the respondents array in the
// owners request, and updates the offer status to applied
export async function acceptBroadOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  const res = await ownerCollection.updateOne(
    { "requests._id": offerId },
    { $push: { "requests.$.respondents": carer._id } }
  );

  // return early if not matched
  if (!res.matchedCount) return res;

  return await carerCollection.updateOne(
    { _id: carer._id, "offers.requestId": offerId },
    { $set: { "offers.$.status": "applied" } }
  );
}

// accept direct offer updates the carer's offer and the owners request to accepted
export async function acceptDirectOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  const res = await ownerCollection.updateOne(
    { "requests._id": offerId },
    { $set: { "requests.$.status": "accepted" } }
  );

  if (!res.matchedCount) return res;

  return await carerCollection.updateOne(
    { _id: carer._id, "offers.requestId": offerId },
    { $set: { "offers.$.status": "accepted" } }
  );
}

// reject pulls the offer from the carers offer array,
export async function rejectBroadOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  return await carerCollection.updateOne(
    { _id: carer._id },
    { $pull: { offers: { requestId: offerId } } }
  );
}

// reject pulls the offer from the carers array and sets the request status to rejected
export async function rejectDirectOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  const res = await ownerCollection.updateOne(
    { "requests._id": offerId },
    { $set: { "requests.$.status": "rejected" } }
  );

  if (!res.matchedCount) return res;

  return await carerCollection.updateOne(
    { _id: carer._id },
    { $pull: { offers: { requestId: offerId } } }
  );
}

export async function getTopNearbyCarers(location: UserLocation) {
  const res = await carerCollection.aggregate([
    {
      $geoNear: {
        near: location,
        distanceField: "distance",
        maxDistance: 100 * 1000, // keep the query within 100km as a hard maximum
        query: { userType: "carer" },
        spherical: true,
      },
    },
    { $match: { $expr: { $lt: ["$distance", "$preferredTravelDistance"] } } },
    { $addFields: { rating: { $avg: "$feedback.rating" } } },
    { $sort: { rating: -1 } },
    {
      $project: {
        _id: 1,
        name: 1,
        pfp: 1,
        rating: 1,
        totalReviews: { $size: "$feedback" },
        recentReview: { $arrayElemAt: ["$feedback", -1] },
      },
    },
  ]);

  return await res.toArray();
}
