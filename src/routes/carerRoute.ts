import { Router } from "express";
import passport from "passport";
import carerController from "../controllers/carerController.js";

const carerRouter = Router();

carerRouter.post(
  "/",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.createNewCarer
);

carerRouter.get(
  "/",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getCarerBySession
);

carerRouter.put(
  "/",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.updateCarer
);

carerRouter.get(
  "/broad",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getBroadOffers
);
carerRouter.get(
  "/direct",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getDirectOffers
);
carerRouter.get(
  "/jobs",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getJobs
);
carerRouter.post(
  "/:offerType(broad|direct)/:offerId/accept",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.acceptOffer
);
carerRouter.post(
  "/:offerType(broad|direct)/:offerId/reject",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.rejectOffer
);

export default carerRouter;
