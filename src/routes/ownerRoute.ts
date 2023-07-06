import { Router } from "express";
import passport from "passport";
import ownerController from "../controllers/ownerController.js";

const ownerRouter = Router();

ownerRouter.get(
  "/owner",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getOwnerBySession
);
ownerRouter.post(
  "/owner/pets",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.addPet
);
ownerRouter.put(
  "/owner/pets/:petId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.updatePet
);
ownerRouter.delete(
  "/owner/pets/:petId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.deletePet
);
ownerRouter.post(
  "/owner/requests",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.createRequest
);
ownerRouter.put(
  "/owner/requests/:requestId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.editRequest
);
ownerRouter.delete(
  "/owner/requests/:requestId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.deleteRequest
);

export default ownerRouter;
