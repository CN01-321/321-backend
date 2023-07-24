import { Router } from "express";
import passport from "passport";
import carerController from "../controllers/carerController.js";
import feebackController from "../controllers/feedbackController.js";

const carerRouter = Router();

carerRouter.get(
  "/carers",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getCarerBySession
);
carerRouter.get(
  "/carers/broad",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getBroadOffers
);
carerRouter.get(
  "/carers/direct",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getDirectOffers
);
carerRouter.get(
  "/carers/jobs",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getJobs
);
carerRouter.post(
  "/carers/:offerType/:offerId/accept",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.acceptOffer
);
carerRouter.post(
  "/carers/:offerType/:offerId/reject",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.rejectOffer
);
carerRouter.get(
  "/carers/:userId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feebackController.getFeedbackForUser
);
carerRouter.post(
  "/owners/:userId/feedback", // :userId is used to be compatible with equivalent owner route
  passport.authenticate("user-jwt", { session: false }),
  feebackController.newFeedbackForUser
);

export default carerRouter;
