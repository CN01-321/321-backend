/**
 * @file Entrypoints for feedback functions, passes parameters to services and
 * handles returning statuses and data back to the client
 * @author George Bull
 */

import Express from "express";
import { WithId } from "mongodb";
import { User } from "../models/user.js";
import feedbackService from "../services/feedbackService.js";

async function getFeedbackForUser(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const user = req.user as User;
  try {
    res.json(await feedbackService.getUserFeedback(user, req.params.userId));
  } catch (err) {
    next(err);
  }
}

async function newFeedbackForUser(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const author = req.user as WithId<User>;
  try {
    res.json(
      await feedbackService.newUserFeedback(author, req.params.userId, req.body)
    );
  } catch (err) {
    next(err);
  }
}

async function addCommentToFeedback(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const author = req.user as WithId<User>;
  try {
    res.json(
      await feedbackService.commentOnFeedback(
        author,
        req.params.userId,
        req.params.feedbackId,
        req.body
      )
    );
  } catch (err) {
    next(err);
  }
}

async function addLikeToReview(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const user = req.user as WithId<User>;
  try {
    res.json(
      await feedbackService.likeUserFeedback(
        user,
        req.params.userId,
        req.params.feedbackId
      )
    );
  } catch (err) {
    next(err);
  }
}

async function getFeedbackForPet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const user = req.user as User;
  try {
    res.json(await feedbackService.getPetFeedback(user, req.params.petId));
  } catch (err) {
    next(err);
  }
}

async function newFeedbackForPet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const author = req.user as WithId<User>;
  try {
    res.json(
      await feedbackService.newPetFeedback(author, req.params.petId, req.body)
    );
  } catch (err) {
    next(err);
  }
}

async function addCommentToPetFeedback(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const author = req.user as WithId<User>;
  try {
    res.json(
      await feedbackService.commentOnPetFeedback(
        author,
        req.params.petId,
        req.params.feedbackId,
        req.body
      )
    );
  } catch (err) {
    next(err);
  }
}

async function addLikeToPetReview(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const user = req.user as WithId<User>;
  try {
    res.json(
      await feedbackService.likePetFeedback(
        user,
        req.params.petId,
        req.params.feedbackId
      )
    );
  } catch (err) {
    next(err);
  }
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
