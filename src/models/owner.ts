import { InsertOneResult, ObjectId, UpdateResult } from "mongodb";
import { ownerCollection } from "../mongo.js";
import { Pet } from "./pet.js";
import { Request } from "./request.js";
import { User } from "./user.js";

export interface Owner extends User {
  pets: Pet[];
  requests: Request[];
}

export async function newOwner(
  email: string,
  passwordHash: string
): Promise<InsertOneResult<Owner>> {
  return ownerCollection.insertOne({
    _id: new ObjectId(),
    email,
    passwordHash,
    userType: "owner",
    notifications: [],
    feedback: [],
    pets: [],
    requests: [],
  });
}

export async function ownerExists(ownerId: ObjectId): Promise<boolean> {
  return (
    (await ownerCollection.findOne({ _id: ownerId, userType: "owner" })) != null
  );
}

export async function getOwnerByEmail(email: string): Promise<Owner | null> {
  return await ownerCollection.findOne({ email, userType: "owner" });
}

export async function updateOwnerDetails(
  ownerId: ObjectId,
  owner: Omit<Partial<Owner>, "_id">
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { _id: new ObjectId(ownerId) },
    { $set: owner }
  );
}

export async function findOwnerWithRequest(
  requestId: ObjectId
): Promise<Owner | null> {
  return await ownerCollection.findOne({ "requests._id": requestId });
}
