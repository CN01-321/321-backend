import { ObjectId } from "mongodb";
import { getCollection } from "../mongo.js";
import { PetSize, PetType } from "./pet.js";
import { User } from "./user.js";

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
  const carerCollection = await getCollection<Carer>();
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
  const carerCollection = await getCollection<Carer>();
  return carerCollection.findOne({ _id: carerId });
}

export async function getCarerByEmail(email: string) {
  const carerCollection = await getCollection<Carer>();
  return carerCollection.findOne({ email, userType: "carer" });
}
