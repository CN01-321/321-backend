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

export default feedbackRouter;
