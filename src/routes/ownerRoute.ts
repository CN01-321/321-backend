import { Router } from "express"
import passport from "passport";
import ownerController from "../controllers/ownerController.js";

const ownerRouter = Router();

ownerRouter.get("/owner", passport.authenticate('owner-jwt', { session: false }), ownerController.getOwnerBySession);
ownerRouter.post("/owner/pets", passport.authenticate('owner-jwt', { session: false }), ownerController.addPet);
ownerRouter.put("/owner/pets/:id", passport.authenticate('owner-jwt', { session: false }), ownerController.updatePet);
ownerRouter.delete("/owner/pets/:id", passport.authenticate('owner-jwt', { session: false }), ownerController.deletePet);

export default ownerRouter;