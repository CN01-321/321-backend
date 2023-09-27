import { ObjectId, UpdateResult, WithId } from "mongodb";
import { userCollection } from "../mongo.js";
import { Feedback } from "./feedback.js";
import { PetSize, PetType } from "./pet.js";

export type UserType = "owner" | "carer";

export interface User {
  _id: ObjectId;
  name?: string;
  email: string;
  passwordHash: string;
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

type ProfileDTO = UserProfileDTO & (OwnerProfileDTO | CarerProfileDTO);

export interface UserProfileDTO {
  _id: ObjectId;
  name: string;
  email: string;
  location?: UserLocation;
  phone?: string;
  bio?: string;
  pfp?: string;
  userType: UserType;
  rating?: number;
  totalReviews: number;
}

interface OwnerProfileDTO {
  numPets: number;
}

interface CarerProfileDTO {
  preferredTravelDistance: number;
  hourlyRate: number;
  preferredPetTypes: PetType[];
  preferredPetSizes: PetSize[];
  completedJobs: number;
}

export async function getUserProfile(
  userId: ObjectId
): Promise<ProfileDTO | null> {
  return (await userCollection
    .aggregate([
      { $match: { _id: userId } },
      {
        $project: {
          _id: 1,
          email: 1,
          userType: 1,
          pfp: 1,
          preferredTravelDistance: 1,
          hourlyRate: 1,
          preferredPetTypes: 1,
          preferredPetSizes: 1,
          rating: { $avg: "$feedback.rating" },
          totalReviews: { $size: "$feedback" },
          numPets: {
            $cond: {
              if: { $isArray: "$pets" },
              then: { $size: "$pets" },
              else: null,
            },
          },
          completedJobs: {
            $cond: {
              if: { $isArray: "$offers" },
              then: {
                $size: {
                  $filter: {
                    input: "$offers",
                    as: "offer",
                    cond: { $eq: ["$$offer.status", "completed"] },
                  },
                },
              },
              else: null,
            },
          },
        },
      },
    ])
    .tryNext()) as ProfileDTO | null;
}

export async function getUserByEmail(
  email: string
): Promise<WithId<User> | null> {
  return await userCollection.findOne({ email });
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

export async function updateUserPassword(user: User, hash: string) {
  return await userCollection.updateOne(
    { _id: user._id },
    { $set: { passwordHash: hash } }
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
