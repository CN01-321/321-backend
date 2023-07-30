import Express from "express";
import { ObjectId, WithId } from "mongodb";
import { User } from "../models/user.js";
import {
  Comment,
  Feedback,
  getFeedback,
  getPetFeedback,
  likePetReview,
  likeReview,
  newComment,
  newFeedback,
  newPetComment,
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
    console.log("feedback is ", feedback, typeof feedback.message);
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

  console.log("req message is", req.body.message);

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

async function addCommentToFeedback(
  req: Express.Request,
  res: Express.Response
) {
  const author = req.user as WithId<User>;

  if (!ObjectId.isValid(req.params.userId)) {
    res.status(400).send("userId is invalid");
    return;
  }

  if (!ObjectId.isValid(req.params.feedbackId)) {
    res.status(400).send("feedbackId is invalid");
    return;
  }

  if (!req.body.message) {
    res.status(400).send("message cannot be empty");
    return;
  }

  const comment: Comment = {
    authorId: author._id,
    authorName: author.name!,
    authorIcon: author.pfp,
    postedOn: new Date(),
    message: req.body.message,
  };

  res.json(
    await newComment(
      comment,
      new ObjectId(req.params.userId),
      new ObjectId(req.params.feedbackId)
    )
  );
}

async function addLikeToReview(req: Express.Request, res: Express.Response) {
  const user = req.user as WithId<User>;

  if (!ObjectId.isValid(req.params.userId)) {
    res.status(400).send("userId is invalid");
    return;
  }

  if (!ObjectId.isValid(req.params.feedbackId)) {
    res.status(400).send("feedbackId is invalid");
    return;
  }

  res.json(
    await likeReview(
      user._id,
      new ObjectId(req.params.userId),
      new ObjectId(req.params.feedbackId)
    )
  );
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

async function addCommentToPetFeedback(
  req: Express.Request,
  res: Express.Response
) {
  const author = req.user as WithId<User>;

  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("petId is invalid");
    return;
  }

  if (!ObjectId.isValid(req.params.feedbackId)) {
    res.status(400).send("feedbackId is invalid");
    return;
  }

  if (!req.body.message) {
    res.status(400).send("message cannot be empty");
    return;
  }

  const comment: Comment = {
    authorId: author._id,
    authorName: author.name!,
    authorIcon: author.pfp,
    postedOn: new Date(),
    message: req.body.message,
  };

  res.json(
    await newPetComment(
      comment,
      new ObjectId(req.params.petId),
      new ObjectId(req.params.feedbackId)
    )
  );
}

async function addLikeToPetReview(req: Express.Request, res: Express.Response) {
  const user = req.user as WithId<User>;

  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("petId is invalid");
    return;
  }

  if (!ObjectId.isValid(req.params.feedbackId)) {
    res.status(400).send("feedbackId is invalid");
    return;
  }

  res.json(
    await likePetReview(
      user._id,
      new ObjectId(req.params.petId),
      new ObjectId(req.params.feedbackId)
    )
  );
}

const feedbackController = {
  getFeedbackForUser,
  newFeedbackForUser,
  addCommentToFeedback,
  addLikeToReview,
  getFeedbackForPet,
  newFeedbackForPet,
  addCommentToPetFeedback,
  addLikeToPetReview,
};

export default feedbackController;
