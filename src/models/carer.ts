import { ObjectId, WithId } from "mongodb";
import { PetSize, PetType } from "./pet.js";
import { User } from "./user.js";
import { carerCollection } from "../mongo.js";

export interface Carer extends User {
  skillsAndExp?: string;
  preferredTravelDistance?: number;
  hourlyRate?: number;
  offers: Array<ObjectId>;
  jobs: Array<ObjectId>;
  unavailabilities: Array<DateRange>;
  preferredPets: Array<PreferredPet>;
  licences: Array<Licence>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PreferredPet {
  petType: PetType;
  petSize: PetSize;
}

export interface Licence {
  name: string;
  number: string;
}

export async function newCarer(email: string, password: string) {
  return carerCollection.insertOne({
    email,
    password,
    userType: "carer",
    notifications: [],
    receivedFeedback: [],
    offers: [],
    jobs: [],
    unavailabilities: [],
    preferredPets: [],
    licences: [],
  });
}

export async function getCarerById(carerId: ObjectId) {
  return carerCollection.findOne({ _id: carerId });
}

export async function getCarerByEmail(email: string) {
  return carerCollection.findOne({ email, userType: "carer" });
}

type JobType = "broad" | "direct" | "job";
export async function getCarerJobs(carer: WithId<Carer>, jobType: JobType) {
  // if job has been accepted, then filter for "accepted" or "completed" statuses
  // otherwise the job is still pending, so only match "pending" status
  const statusFilters =
    jobType == "job" ? ["accepted", "completed"] : ["pending"];

  // if the job has been accepted/completed or the request is a direct request
  // the request.carer id will be set, otherwise filter broad requests by
  // matching null
  const carerFilter = jobType === "broad" ? null : carer._id;

  const res = await carerCollection.aggregate([
    { $match: { _id: carer._id } },
    {
      $lookup: {
        from: "users",
        let: { offers: "$offers" },
        pipeline: [
          { $unwind: "$requests" },
          {
            $match: {
              $expr: {
                $in: ["$requests._id", "$$offers"],
              },
              "requests.status": { $in: statusFilters },
              "requests.carer": carerFilter,
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
