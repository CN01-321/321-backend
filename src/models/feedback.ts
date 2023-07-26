import { ObjectId, WithId } from "mongodb";
import { ownerCollection, userCollection } from "../mongo.js";
import { User } from "./user.js";

export interface Feedback {
  _id: ObjectId;
  authorId: ObjectId;
  authorName: string;
  authorIcon?: string;
  postedOn: Date;
  rating?: number;
  message: string;
  image?: string;
  likes: number;
  comments: Array<Comment>;
}

export interface Comment {
  authorId: ObjectId;
  authorName: string;
  authorIcon?: string;
  postedOn: Date;
  message: string;
}

export async function getFeedback(userId: ObjectId) {
  const res = await userCollection.aggregate([
    { $match: { _id: userId } },
    { $unwind: "$feedback" },
    { $replaceWith: "$feedback" },
  ]);

  return await res.toArray();
}

export async function newFeedback(feedback: Feedback, userId: ObjectId) {
  return await userCollection.updateOne(
    { _id: userId },
    { $push: { feedback: feedback } }
  );
}

export async function getPetFeedback(petId: ObjectId) {
  const res = await ownerCollection.aggregate([
    { $match: { "pets._id": petId } },
    { $unwind: "$pets" },
    { $match: { "pets._id": petId } },
    { $unwind: "$pets.feedback" },
    { $replaceWith: "$pets.feedback" },
  ]);

  return await res.toArray();
}

export async function newPetFeedback(feedback: Feedback, petId: ObjectId) {
  return await ownerCollection.updateOne(
    { "pets._id": petId },
    { $push: { "pets.$.feedback": feedback } }
  );
}
