import { Router } from "express";
import passport from "passport";
import feedbackController from "../controllers/feedbackController.js";

const feedbackRouter = Router();

feedbackRouter.get(
  "/users/:userId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.getFeedbackForUser
);
feedbackRouter.post(
  "/users/:userId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.newFeedbackForUser
);
feedbackRouter.post(
  "/users/:userId/feedback/:feedbackId/comments",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addCommentToFeedback
);
feedbackRouter.post(
  "/users/:userId/feedback/:feedbackId/likes",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addLikeToReview
);
feedbackRouter.get(
  "/pets/:petId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.getFeedbackForPet
);
feedbackRouter.post(
  "/pets/:petId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.newFeedbackForPet
);
feedbackRouter.post(
  "/pets/:petId/feedback/:feedbackId/comments",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addCommentToPetFeedback
);
feedbackRouter.post(
  "/pets/:petId/feedback/:feedbackId/likes",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addLikeToPetReview
);

export default feedbackRouter;
