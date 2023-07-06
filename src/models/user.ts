import { ObjectId } from "mongodb";
import { getCollection } from "../mongo.js";
import { Feedback } from "./feedback.js";

export type UserType = "owner" | "carer";

export interface User {
  _id?: ObjectId;
  name?: string;
  email: string;
  password: string;
  address?: string;
  phone?: string;
  bio?: string;
  locationLat?: number;
  locationLng?: number;
  pfp?: string;
  userType: UserType;
  notifications: Array<Notification>;
  receivedFeedback: Array<Feedback>;
}

export interface Notification {
  name: string;
  desc: string;
}

export async function getUserByEmail(email: string) {
  const userCollection = await getCollection<User>();
  return await userCollection.findOne({ email });
}

export async function getUserByEmailAndPassword(
  email: string,
  password: string
) {
  const userCollection = await getCollection<User>();
  return await userCollection.findOne({ email, password });
}

export async function checkEmailExists(email: string) {
  const userCollection = await getCollection<User>();
  return await userCollection.findOne({ email });
}
