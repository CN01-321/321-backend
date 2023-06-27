import { Router } from "express"
import passport from "passport";
import ownerController from "../controllers/ownerController.js";

const ownerRouter = Router();

ownerRouter.get("/owner/pets", passport.authenticate('jwt', { session: false }), ownerController.getPets);
ownerRouter.post("/owner/pets", passport.authenticate('jwt', { session: false }), ownerController.addPet);
ownerRouter.delete("/owner/pet/:id", passport.authenticate('jwt', { session: false }), ownerController.deletePet);

export default ownerRouter;