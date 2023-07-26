import Express from "express";
import { ObjectId, WithId } from "mongodb";
import { User } from "../models/user.js";
import {
  Feedback,
  getFeedback,
  getPetFeedback,
  newFeedback,
  newPetFeedback,
} from "../models/feedback.js";
import { handleControllerError } from "../util.js";

async function getFeedbackForUser(req: Express.Request, res: Express.Response) {
  if (!ObjectId.isValid(req.params.userId)) {
    res.status(400).send("userId is invalid");
    return;
  }

  res.json(await getFeedback(new ObjectId(req.params.userId)));
}

function validateFeedback(feedback: any): Feedback {
  if (!feedback.message || typeof feedback.message !== "string") {
    throw new Error("Feedback must contain a message");
  }

  if (feedback.rating && typeof feedback.rating !== "number") {
    throw new Error("Rating must be a number");
  }

  // clamp feedback rating ranges to a rating of 0-5 if rating is presesnt
  if (feedback.rating) {
    feedback.rating = Math.max(0, Math.min(feedback.rating, 5));
  }

  return feedback as Feedback;
}

async function newFeedbackForUser(req: Express.Request, res: Express.Response) {
  const author = req.user as WithId<User>;

  if (!ObjectId.isValid(req.params.userId)) {
    res.status(400).send("userId is invalid");
    return;
  }

  const feedbackData: any = {
    _id: new ObjectId(),
    authorId: author._id,
    authorName: author.name!,
    // TODO author icon path
    postedOn: new Date(),
    message: req.body.message,
    likes: 0,
    comments: [],
  };

  // add rating only if it is contained in the post request
  if (req.body.rating) {
    feedbackData.rating = req.body.rating;
  }

  try {
    const feedback = validateFeedback(feedbackData);
    res.json(await newFeedback(feedback, new ObjectId(req.params.userId)));
  } catch (e) {
    handleControllerError(res, e, 400);
  }
}

async function getFeedbackForPet(req: Express.Request, res: Express.Response) {
  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("petId is invalid");
    return;
  }

  res.json(await getPetFeedback(new ObjectId(req.params.petId)));
}

async function newFeedbackForPet(req: Express.Request, res: Express.Response) {
  const author = req.user as WithId<User>;

  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("petId is invalid");
    return;
  }

  const feedbackData: any = {
    _id: new ObjectId(),
    authorId: author._id,
    authorName: author.name!,
    // TODO author icon path
    postedOn: new Date(),
    message: req.body.message,
    likes: 0,
    comments: [],
  };

  // add rating only if it is contained in the post request
  if (req.body.rating) {
    feedbackData.rating = req.body.rating;
  }

  try {
    const feedback = validateFeedback(feedbackData);
    res.json(await newPetFeedback(feedback, new ObjectId(req.params.petId)));
  } catch (e) {
    handleControllerError(res, e, 400);
  }
}

const feedbackController = {
  getFeedbackForUser,
  newFeedbackForUser,
  getFeedbackForPet,
  newFeedbackForPet,
};

export default feedbackController;
