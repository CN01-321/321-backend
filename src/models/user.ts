import { ObjectId, UpdateResult, WithId } from "mongodb";
import { userCollection } from "../mongo.js";
import { Feedback } from "./feedback.js";

export type UserType = "owner" | "carer";

export interface User {
  _id: ObjectId;
  name?: string;
  email: string;
  password: string;
  location?: UserLocation;
  phone?: string;
  bio?: string;
  pfp?: string;
  userType: UserType;
  notifications: Notification[];
  feedback: Feedback[];
}

export interface UserLocation {
  type: "Point"; // the GeoJSON type is always "Point"
  coordinates: [number, number]; // longitude, latitude
  street: string;
  city: string;
  state: string;
  postcode: string;
}

type NotificationType =
  | "recievedDirect"
  | "recievedFeedback"
  | "acceptedDirect"
  | "acceptedBroad";

export interface Notification {
  notificationType: NotificationType;
  subjectName: string;
  subjectPfp?: string;
  notifiedOn: Date;
}

export async function getUserById(
  userId: ObjectId
): Promise<WithId<User> | null> {
  return await userCollection.findOne({ _id: userId });
}

export async function getUserByEmail(
  email: string
): Promise<WithId<User> | null> {
  return await userCollection.findOne({ email });
}

export async function getUserByEmailAndPassword(
  email: string,
  password: string
): Promise<WithId<User> | null> {
  return await userCollection.findOne({ email, password });
}

export async function checkEmailExists(
  email: string
): Promise<WithId<User> | null> {
  return await userCollection.findOne({ email });
}

export async function updateUserPfp(
  user: User,
  imageId: string
): Promise<UpdateResult<User>> {
  return await userCollection.updateOne(
    { _id: user._id },
    { $set: { pfp: imageId } }
  );
}

export async function getNotifications(
  userId: ObjectId
): Promise<Notification[]> {
  const res = await userCollection.aggregate([
    { $match: { _id: userId } },
    { $unwind: "$notifications" },
    { $replaceWith: "$notifications" },
  ]);

  return (await res.toArray()) as Notification[];
}

export async function newNotification(
  userId: ObjectId,
  notification: Notification
): Promise<UpdateResult<User>> {
  return userCollection.updateOne(
    { _id: userId },
    { $push: { notifications: notification } }
  );
}
