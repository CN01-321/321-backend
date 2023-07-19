import { Router } from "express";
import passport from "passport";
import carerController from "../controllers/carerController.js";

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

export default carerRouter;
