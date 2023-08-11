import { ObjectId } from "mongodb";
import { ownerCollection } from "../mongo.js";
import { Pet } from "./pet.js";
import { Request } from "./request.js";
import { User } from "./user.js";

export interface Owner extends User {
  pets: Array<Pet>;
  requests: Array<Request>;
}

export async function newOwner(email: string, password: string) {
  return ownerCollection.insertOne({
    _id: new ObjectId(),
    email,
    password,
    userType: "owner",
    notifications: [],
    feedback: [],
    pets: [],
    requests: [],
  });
}

export async function ownerExists(ownerId: ObjectId) {
  return (
    (await ownerCollection.findOne({ _id: ownerId, userType: "owner" })) != null
  );
}

export async function getOwnerByEmail(email: string) {
  return await ownerCollection.findOne({ email, userType: "owner" });
}

export async function updateOwnerDetails(
  ownerId: ObjectId,
  owner: Omit<Partial<Owner>, "_id">
) {
  return await ownerCollection.updateOne(
    { _id: new ObjectId(ownerId) },
    { $set: owner }
  );
}
