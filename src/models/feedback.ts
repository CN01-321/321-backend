import { ObjectId, UpdateResult } from "mongodb";
import { ownerCollection, userCollection } from "../mongo.js";
import { User } from "./user.js";
import { Owner } from "./owner.js";

export interface Feedback {
  _id: ObjectId;
  authorId: ObjectId;
  authorName: string;
  authorIcon?: string;
  postedOn: Date;
  rating?: number;
  message: string;
  image?: string;
  likes: ObjectId[]; // array of userIds who have liked this feedback
  comments: Comment[];
}

export interface Comment {
  authorId: ObjectId;
  authorName: string;
  authorIcon?: string;
  postedOn: Date;
  message: string;
}

interface FeedbackDTO {
  _id: ObjectId;
  authorId: ObjectId;
  authorName: string;
  authorIcon?: string;
  postedOn: Date;
  message: string;
  rating?: number;
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export async function getFeedback(
  currentUserId: ObjectId,
  userId: ObjectId
): Promise<FeedbackDTO[]> {
  const res = await userCollection.aggregate([
    { $match: { _id: userId } },
    { $unwind: "$feedback" },
    { $replaceWith: "$feedback" },
    {
      $project: {
        _id: 1,
        authorId: 1,
        authorName: 1,
        authorIcon: 1,
        postedOn: 1,
        message: 1,
        rating: 1,
        likes: { $size: "$likes" },
        liked: {
          $cond: {
            if: { $in: [currentUserId, "$likes"] },
            then: true,
            else: false,
          },
        },
        comments: 1,
      },
    },
  ]);

  return (await res.toArray()) as FeedbackDTO[];
}

export async function newFeedback(feedback: Feedback, userId: ObjectId) {
  return await userCollection.updateOne(
    { _id: userId },
    { $push: { feedback: feedback } }
  );
}

export async function newComment(
  comment: Comment,
  userId: ObjectId,
  feedbackId: ObjectId
): Promise<UpdateResult<User>> {
  return await userCollection.updateOne(
    { _id: userId, "feedback._id": feedbackId },
    { $push: { "feedback.$.comments": comment } }
  );
}

export async function likeReview(
  likerId: ObjectId,
  userId: ObjectId,
  feedbackId: ObjectId
): Promise<UpdateResult<User>> {
  return await userCollection.updateOne(
    { _id: userId, "feedback._id": feedbackId },
    { $addToSet: { "feedback.$.likes": likerId } }
  );
}

export async function getPetFeedback(
  currentUserId: ObjectId,
  petId: ObjectId
): Promise<FeedbackDTO[]> {
  const res = await ownerCollection.aggregate([
    { $match: { "pets._id": petId } },
    { $unwind: "$pets" },
    { $match: { "pets._id": petId } },
    { $unwind: "$pets.feedback" },
    { $replaceWith: "$pets.feedback" },
    {
      $project: {
        _id: 1,
        authorId: 1,
        authorName: 1,
        authorIcon: 1,
        postedOn: 1,
        message: 1,
        likes: { $size: "$likes" },
        liked: {
          $cond: {
            if: { $in: [currentUserId, "$likes"] },
            then: true,
            else: false,
          },
        },
        comments: 1,
      },
    },
  ]);

  return (await res.toArray()) as FeedbackDTO[];
}

export async function newPetFeedback(
  feedback: Feedback,
  petId: ObjectId
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { "pets._id": petId },
    { $push: { "pets.$.feedback": feedback } }
  );
}

export async function newPetComment(
  comment: Comment,
  petId: ObjectId,
  feedbackId: ObjectId
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { "pets._id": petId, "pets.feedback._id": feedbackId },
    { $push: { "pets.$[pid].feedback.$[fid].comments": comment } },
    { arrayFilters: [{ "pid._id": petId }, { "fid._id": feedbackId }] }
  );
}

export async function likePetReview(
  likerId: ObjectId,
  petId: ObjectId,
  feedbackId: ObjectId
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { "pets._id": petId, "pets.feedback._id": feedbackId },
    { $addToSet: { "pets.$[pid].feedback.$[fid].likes": likerId } },
    { arrayFilters: [{ "pid._id": petId }, { "fid._id": feedbackId }] }
  );
}
