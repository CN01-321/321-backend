import { Router } from "express";
import passport from "passport";
import carerController from "../controllers/carerController.js";

const carerRouter = Router();

carerRouter.get(
  "/carer",
  passport.authenticate("carer-jwt", { session: false }),
  carerController.getCarerBySession
);

export default carerRouter;
