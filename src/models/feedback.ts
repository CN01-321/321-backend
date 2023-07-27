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
  likes: Array<ObjectId>; // array of userIds who have liked this feedback
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
    {
      $project: {
        _id: 1,
        authorId: 1,
        authorName: 1,
        postedOn: 1,
        message: 1,
        likes: { $size: "$likes" },
        comments: 1,
      },
    },
  ]);

  return await res.toArray();
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
) {
  return await userCollection.updateOne(
    { _id: userId, "feedback._id": feedbackId },
    { $push: { "feedback.$.comments": comment } }
  );
}

export async function likeReview(
  likerId: ObjectId,
  userId: ObjectId,
  feedbackId: ObjectId
) {
  return await ownerCollection.updateOne(
    { _id: userId, "feedback._id": feedbackId },
    { $addToSet: { "feedback.$.likes": likerId } }
  );
}

export async function getPetFeedback(petId: ObjectId) {
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
        postedOn: 1,
        message: 1,
        likes: { $size: "$likes" },
        comments: 1,
      },
    },
  ]);

  return await res.toArray();
}

export async function newPetFeedback(feedback: Feedback, petId: ObjectId) {
  return await ownerCollection.updateOne(
    { "pets._id": petId },
    { $push: { "pets.$.feedback": feedback } }
  );
}

export async function newPetComment(
  comment: Comment,
  petId: ObjectId,
  feedbackId: ObjectId
) {
  return await ownerCollection.updateOne(
    { "pets._id": petId, "pets.feedback._id": feedbackId },
    { $push: { "pets.$feedback.$.comments": comment } }
  );
}

export async function likePetReview(
  likerId: ObjectId,
  petId: ObjectId,
  feedbackId: ObjectId
) {
  return await ownerCollection.updateOne(
    { "pets._id": petId, "pets.feedback._id": feedbackId },
    { $addToSet: { "pets.$[pid].feedback.$[fid].likes": likerId } },
    { arrayFilters: [{ "pid._id": petId }, { "fid._id": feedbackId }] }
  );
}
