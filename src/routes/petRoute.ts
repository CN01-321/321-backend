/**
 * @file Handles pet related routes
 * @author George Bull
 */

import { Router } from "express";
import passport from "passport";
import feedbackController from "../controllers/feedbackController.js";
import petController from "../controllers/petController.js";

const petRouter = Router();

petRouter.get(
  "/:petId",
  passport.authenticate("user-jwt", { session: false }),
  petController.getPet
);
petRouter.get(
  "/:petId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.getFeedbackForPet
);
petRouter.post(
  "/:petId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.newFeedbackForPet
);
petRouter.post(
  "/:petId/feedback/:feedbackId/comments",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addCommentToPetFeedback
);
petRouter.post(
  "/:petId/feedback/:feedbackId/likes",
  passport.authenticate("user-jwt", { session: false }),
  feedbackController.addLikeToPetReview
);
export default petRouter;
