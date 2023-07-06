import { getCollection } from "../mongo.js";
import { Pet } from "./pet.js";
import { Request } from "./request.js";
import { User } from "./user.js";

export interface Owner extends User {
  pets: Array<Pet>;
  requests: Array<Request>;
}

export async function newOwner(email: string, password: string) {
  const ownerCollection = await getCollection<Owner>();
  return ownerCollection.insertOne({
    email,
    password,
    userType: "owner",
    notifications: [],
    receivedFeedback: [],
    pets: [],
    requests: [],
  });
}

export async function getOwnerByEmail(email: string) {
  const ownerCollection = await getCollection<Owner>();
  return await ownerCollection.findOne({ email, userType: "owner" });
}
