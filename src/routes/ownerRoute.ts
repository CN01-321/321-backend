import { Router } from "express";
import passport from "passport";
import ownerController from "../controllers/ownerController.js";

const ownerRouter = Router();

ownerRouter.post(
  "/",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.createNewOwner
);
ownerRouter.get(
  "/",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getOwnerBySession
);
ownerRouter.put(
  "/",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.updateOwner
);
ownerRouter.get(
  "/pets",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getPets
);
ownerRouter.post(
  "/pets",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.addPet
);
ownerRouter.put(
  "/pets/:petId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.updatePet
);
ownerRouter.delete(
  "/pets/:petId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.deletePet
);
// search must be above :requestId so that "nearby" is not matched as an id
ownerRouter.get(
  "/requests/nearby",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getNearbyRequests
);
ownerRouter.get(
  "/requests/:requestId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getRequest
);
ownerRouter.get(
  "/requests/:requestId/respondents",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getRequestRespondents
);
ownerRouter.get(
  "/requests",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getRequests
);
ownerRouter.post(
  "/requests",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.createRequest
);
ownerRouter.post(
  "/requests/:requestId/respondents/:respondentId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.acceptRespondent
);
ownerRouter.get(
  "/requests/:requestId/pets",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getPetsFromRequest
);

export default ownerRouter;
