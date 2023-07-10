import { ObjectId } from "mongodb";
import { PetSize, PetType } from "./pet.js";
import { User } from "./user.js";
import { carerCollection } from "../mongo.js";

export interface Carer extends User {
  skillsAndExp?: string;
  preferredTravelDistance?: number;
  hourlyRate?: number;
  offers: Array<ObjectId>;
  unavailabilities: Array<DateRange>;
  preferredPets: Array<PreferredPet>;
  licences: Array<Licence>;
}

export interface DateRange {
  startDate: Date;
  duration: number;
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
