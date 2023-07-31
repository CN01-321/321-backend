import { ObjectId, WithId } from "mongodb";
import { PetSize, PetType, petSizes, petTypes } from "./pet.js";
import { User, UserUpdateForm } from "./user.js";
import { carerCollection, ownerCollection } from "../mongo.js";

const DEFAULT_TRAVEL_DISTANCE_METRES = 50000;
const DEFAULT_HOURLY_RATE = 20;

export interface Carer extends User {
  skillsAndExp?: string;
  preferredTravelDistance: number; // distance is in metres
  hourlyRate: number;

  // TODO add some "accepted" field so that unaccepted and accepted broad
  // requests can be differentiated
  offers: Array<ObjectId>;
  jobs: Array<ObjectId>;
  unavailabilities: Array<DateRange>;
  preferredPetTypes: Array<PetType>;
  preferredPetSizes: Array<PetSize>;
  licences: Array<Licence>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Licence {
  name: string;
  number: string;
}

export interface CarerUpdateForm extends UserUpdateForm {
  preferredTravelDistance: number; // distance is in metres
  hourlyRate: number;
}

export async function newCarer(email: string, password: string) {
  return carerCollection.insertOne({
    email,
    password,
    userType: "carer",
    notifications: [],
    preferredTravelDistance: DEFAULT_TRAVEL_DISTANCE_METRES,
    hourlyRate: DEFAULT_HOURLY_RATE,
    feedback: [],
    offers: [],
    jobs: [],
    unavailabilities: [],
    preferredPetTypes: petTypes, // preferr all pet types and sizes by default
    preferredPetSizes: petSizes,
    licences: [],
  });
}

export async function getCarerById(carerId: ObjectId) {
  return carerCollection.findOne(
    { _id: carerId },
    {
      projection: {
        _id: 1,
        email: 1,
        userType: 1,
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

export async function updateCarerDetails(carerId: ObjectId, form: CarerUpdateForm) {
  const updatedFields: any = {};
  
  if (form.name) {
    updatedFields.name = form.name;
  }
  if (form.email) {
    updatedFields.email = form.email;
  }
  if (form.coords && form.street && form.city && form.state && form.postcode) {
    updatedFields.location = {
      type: "Point",
      coordinates: form.coords,
      street: form.street,
      city: form.city,
      state: form.state,
      postcode: form.postcode
    }
  }
  if (form.phone) {
    updatedFields.phone = form.phone;
  }
  if (form.bio) {
    updatedFields.bio = form.bio;
  }
  if (form.pfp) {}
  if (form.preferredTravelDistance) {
    updatedFields.preferredTravelDistance = form.preferredTravelDistance;
  }
  if (form.hourlyRate) {
    updatedFields.hourlyRate = form.hourlyRate;
  }

  await carerCollection.updateOne(
    { _id: new ObjectId(carerId) },
    { $set: updatedFields }
  );
}

type OfferType = "broad" | "direct";
export async function getCarerOffers(
  carer: WithId<Carer>,
  offerType: OfferType
) {
  // if the request is a direct request the request.carer id will be set,
  // otherwise filter broad requests by matching null
  const carerFilter = offerType === "broad" ? null : carer._id;

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

export async function getCarerJobs(carer: WithId<Carer>) {
  const res = await carerCollection.aggregate([
    { $match: { _id: carer._id } },
    {
      $lookup: {
        from: "users",
        let: { jobs: "$jobs" },
        pipeline: [
          { $unwind: "$requests" },
          {
            $match: {
              $expr: {
                $in: ["$requests._id", "$$jobs"],
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
// owners request
export async function acceptBroadOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  return await ownerCollection.updateOne(
    { "requests._id": offerId },
    { $push: { "requests.$.respondents": carer._id } }
  );
}

// accept direct offer moves the request to the carer's jobs array, and updates
// the request accordingly
export async function acceptDirectOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  console.log(
    await ownerCollection.updateOne(
      { "requests._id": offerId },
      { $set: { "requests.$.status": "accepted" } }
    )
  );

  return await carerCollection.updateOne(
    { _id: carer._id },
    { $push: { jobs: offerId }, $pull: { offers: offerId } }
  );
}

export async function rejectBroadOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  return await carerCollection.updateOne(
    { _id: carer._id },
    { $pull: { offers: offerId } }
  );
}

export async function rejectDirectOffer(
  carer: WithId<Carer>,
  offerId: ObjectId
) {
  await ownerCollection.updateOne(
    { "requests._id": offerId },
    { $set: { "requests.$.status": "rejected" } }
  );

  return await carerCollection.updateOne(
    { _id: carer._id },
    { $pull: { offers: offerId } }
  );
}
