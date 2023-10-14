/**
 * @file Handles user related routes
 * @author George Bull
 */

import { Router } from "express";
import userController from "../controllers/userController.js";
import passport from "passport";
import feedbackController from "../controllers/feedbackController.js";
import bodyParser from "body-parser";

const userRouter = Router();

userRouter.post(
  "/pfp",
  passport.authenticate("user-jwt", { session: false }),
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "20mb" }),
  userController.setPfp
);
userRouter.post(
  "/password",
  passport.authenticate("user-jwt", { session: false }),
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "20mb" }),
  userController.setPassword
);
userRouter.get(
  "/notifications",
  passport.authenticate("user-jwt", { session: false }),
  userController.getUserNotifications
);
userRouter.get(
  "/:userId",
  passport.authenticate("user-jwt", { session: false }),
  userController.getUser
);
userRouter.get(
  "/:userId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.getFeedbackForUser
);
userRouter.post(
  "/:userId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.newFeedbackForUser
);
userRouter.post(
  "/:userId/feedback/:feedbackId/comments",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addCommentToFeedback
);
userRouter.post(
  "/:userId/feedback/:feedbackId/likes",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addLikeToReview
);

export default userRouter;
