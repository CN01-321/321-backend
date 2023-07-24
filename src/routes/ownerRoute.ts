import { Router } from "express";
import passport from "passport";
import ownerController from "../controllers/ownerController.js";
import feebackController from "../controllers/feedbackController.js";

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
ownerRouter.get(
  "/owners/pets",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getPets
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
// search must be above :requestId so that "nearby" is not matched as an id
ownerRouter.get(
  "/owners/requests/nearby",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.searchRequests
);
ownerRouter.get(
  "/owners/requests/:requestId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getRequest
);
ownerRouter.get(
  "/owners/requests/:requestId/respondents",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getRequestRespondents
);
ownerRouter.get(
  "/owners/requests",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.getRequests
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
ownerRouter.post(
  "/owners/requests/:requestId/respondents/:respondentId",
  passport.authenticate("owner-jwt", { session: false }),
  ownerController.acceptRespondent
);
ownerRouter.get(
  "/owners/:userId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feebackController.getFeedbackForUser
);
ownerRouter.post(
  "/owners/:userId/feedback", // :userId is used to be compatible with equivalent carer route
  passport.authenticate("user-jwt", { session: false }),
  feebackController.newFeedbackForUser
);
ownerRouter.get(
  "/pets/:petId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feebackController.getFeedbackForPet
);
ownerRouter.post(
  "/pets/:petId/feedback",
  passport.authenticate("user-jwt", { session: false }),
  feebackController.newFeedbackForPet
);

export default ownerRouter;
