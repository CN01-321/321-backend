import { Router } from "express";
import passport from "passport";
import ownerController from "../controllers/ownerController.js";

const ownerRouter = Router();

ownerRouter.get(
  "/owners",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getOwnerBySession
);
ownerRouter.get(
  "/owners/pets/:petId",
  passport.authenticate("user-jwt", { session: false }),
  ownerController.getPet
);
ownerRouter.post(
  "/owners/pets",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.addPet
);
ownerRouter.put(
  "/owners/pets/:petId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.updatePet
);
ownerRouter.delete(
  "/owners/pets/:petId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.deletePet
);
ownerRouter.post(
  "/owners/requests",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.createRequest
);
ownerRouter.put(
  "/owners/requests/:requestId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.editRequest
);
ownerRouter.delete(
  "/owners/requests/:requestId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.deleteRequest
);

export default ownerRouter;
