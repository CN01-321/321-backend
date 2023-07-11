import { ObjectId } from "mongodb";
import { userCollection } from "../mongo.js";
import { Feedback } from "./feedback.js";

export type UserType = "owner" | "carer";

export interface User {
  _id?: ObjectId;
  name?: string;
  email: string;
  password: string;
  location?: UserLocation;
  address?: string;
  phone?: string;
  bio?: string;
  pfp?: string;
  userType: UserType;
  notifications: Array<Notification>;
  receivedFeedback: Array<Feedback>;
}

export interface UserLocation {
  state: string;
  city: string;
  street: string;
  lat: number;
  lng: number;
}

export interface Notification {
  name: string;
  desc: string;
}

export async function getUserByEmail(email: string) {
  return await userCollection.findOne({ email });
}

export async function getUserByEmailAndPassword(
  email: string,
  password: string
) {
  return await userCollection.findOne({ email, password });
}

export async function checkEmailExists(email: string) {
  return await userCollection.findOne({ email });
}
