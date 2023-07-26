import { Router } from "express";
import userController from "../controllers/userController.js";
import passport from "passport";

const userRouter = Router();

userRouter.get(
  "/users/:userId",
  passport.authenticate("user-jwt", { session: false }),
  userController.getUser
);

export default userRouter;
