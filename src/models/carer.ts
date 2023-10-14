/**
 * @file Declares the Carer interfaces and model functions
 * @author George Bull
 */

import { InsertOneResult, ObjectId, UpdateResult, WithId } from "mongodb";
import { PetSize, PetType, petSizes, petTypes } from "./pet.js";
import { User, UserLocation } from "./user.js";
import { carerCollection, ownerCollection } from "../mongo.js";
import { Feedback } from "./feedback.js";

const DEFAULT_TRAVEL_DISTANCE_METRES = 50000;
const DEFAULT_HOURLY_RATE = 20;

export interface Carer extends User {
  preferredTravelDistance: number; // distance is in metres
  hourlyRate: number;
  offers: Offer[];
  preferredPetTypes: PetType[];
  preferredPetSizes: PetSize[];
}

export type OfferType = "broad" | "direct";
type OfferStatus = "pending" | "applied" | "accepted" | "completed";
interface Offer {
  requestId: ObjectId;
  offerType: OfferType;
  status: OfferStatus;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export async function newCarer(
  email: string,
  passwordHash: string
): Promise<InsertOneResult<Carer>> {
  return await carerCollection.insertOne({
    _id: new ObjectId(),
    email,
    passwordHash,
    userType: "carer",
    notifications: [],
    preferredTravelDistance: DEFAULT_TRAVEL_DISTANCE_METRES,
    hourlyRate: DEFAULT_HOURLY_RATE,
    feedback: [],
    offers: [],
    preferredPetTypes: petTypes, // prefer all pet types and sizes by default
    preferredPetSizes: petSizes,
  });
}

export async function carerExists(carerId: ObjectId): Promise<boolean> {
  return (
    (await ownerCollection.findOne({ _id: carerId, userType: "carer" })) != null
  );
}

export async function getCarerById(
  carerId: ObjectId
): Promise<WithId<Carer> | null> {
  return await carerCollection.findOne(
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

export async function getCarerByEmail(
  email: string
): Promise<WithId<Carer> | null> {
  return await carerCollection.findOne({ email, userType: "carer" });
}

export async function updateCarerDetails(
  carerId: ObjectId,
  carer: Omit<Partial<Carer>, "_id">
): Promise<UpdateResult<Carer>> {
  return await carerCollection.updateOne(
    { _id: new ObjectId(carerId) },
    { $set: carer }
  );
}

interface OfferDTO {
  _id: ObjectId;
  ownerName: string;
  ownerIcon?: string;
  pets: Array<{
    _id: ObjectId;
    name: string;
    petType: PetType;
  }>;
  dateRange: DateRange;
  location: UserLocation;
  requestedOn: Date;
  status: OfferStatus;
}

const lookupOfferUserQuery = [
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
];

/**
 * For each offer of offerType, fetch request information as well as pet and
 * owner information
 */
export async function getCarerOffers(
  carer: WithId<Carer>,
  offerType: OfferType
): Promise<OfferDTO[]> {
  const res = await carerCollection.aggregate([
    { $match: { _id: carer._id } },
    { $unwind: "$offers" },
    { $replaceWith: "$offers" },
    { $match: { offerType, status: { $in: ["pending", "applied"] } } },
    ...lookupOfferUserQuery,
  ]);

  return (await res.toArray()) as OfferDTO[];
}

/**
 * For each current or completed job, fetch request information
 */
export async function getCarerJobs(carer: WithId<Carer>): Promise<OfferDTO[]> {
  const res = await carerCollection.aggregate([
    { $match: { _id: carer._id } },
    { $unwind: "$offers" },
    { $replaceWith: "$offers" },
    { $match: { status: { $in: ["accepted", "completed"] } } },
    ...lookupOfferUserQuery,
  ]);

  return (await res.toArray()) as OfferDTO[];
}

/**
 * accept broad offer places the carer's id onto the respondents array in the
 * owners request, and updates the offer status to applied
 */
export async function acceptBroadOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
): Promise<UpdateResult<User>> {
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

/**
 * accept direct offer updates the carer's offer and the owners request to
 * accepted
 */
export async function acceptDirectOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
): Promise<UpdateResult<User>> {
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

/**
 * reject broad offer pulls the offer from the carers offer array.
 */
export async function rejectBroadOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
): Promise<UpdateResult<Carer>> {
  return await carerCollection.updateOne(
    { _id: carer._id },
    { $pull: { offers: { requestId: offerId } } }
  );
}

/**
 * reject direct offer pulls the offer from the carers array and also
 * updates the owner's request status to rejected
 */
export async function rejectDirectOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
): Promise<UpdateResult<User>> {
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

/**
 * Complete offer sets the status to complete for both the offer and the owner's
 * request
 */
export async function completeOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
): Promise<UpdateResult<User>> {
  const res = await ownerCollection.updateOne(
    { "requests._id": offerId },
    { $set: { "requests.$.status": "completed" } }
  );

  // return early if not matched
  if (!res.matchedCount) return res;

  return await carerCollection.updateOne(
    { _id: carer._id, "offers.requestId": offerId },
    { $set: { "offers.$.status": "completed" } }
  );
}

interface TopCarerDTO {
  _id: ObjectId;
  name: string;
  pfp?: string;
  rating: number;
  totalReviews: number;
  recentReview: Feedback;
}

export function findNearbyCarersAsDistanceQuery(near: UserLocation | string) {
  return {
    $geoNear: {
      near,
      distanceField: "distance",
      maxDistance: 100 * 1000, // keep the query within 100km as a hard maximum
      query: { userType: "carer" },
      spherical: true,
    },
  };
}

/**
 * getTopNearbyCarers fetches the carers that are in travel distance to the
 * given location and sorts them by best to worst rating
 */
export async function getTopNearbyCarers(
  location: UserLocation
): Promise<TopCarerDTO[]> {
  const res = await carerCollection.aggregate([
    findNearbyCarersAsDistanceQuery(location),
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

  return (await res.toArray()) as TopCarerDTO[];
}
