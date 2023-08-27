import { ObjectId } from "mongodb";
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

export async function getUserById(userId: ObjectId) {
  return await userCollection.findOne(
    { _id: userId },
    // only include fields for owners and carers that arent associated with other endpoints
    {
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        userType: 1,
        pfp: 1,
        bio: 1,
        phone: 1,
        preferredTravelDistance: 1,
        hourlyRate: 1,
        unavailabilities: 1,
        preferredPetTypes: 1,
        preferredPetSizes: 1,
      },
    }
  );
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

export async function updateUserPfp(user: User, imageId: string) {
  return await userCollection.updateOne(
    { _id: user._id },
    { $set: { pfp: imageId } }
  );
}

export async function getNotifications(userId: ObjectId) {
  const res = await userCollection.aggregate([
    { $match: { _id: userId } },
    { $unwind: "$notifications" },
    { $replaceWith: "$notifications" },
  ]);

  return await res.toArray();
}

export async function newNotification(
  userId: ObjectId,
  notification: Notification
) {
  return userCollection.updateOne(
    { _id: userId },
    { $push: { notifications: notification } }
  );
}
