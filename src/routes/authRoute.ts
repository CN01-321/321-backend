import { Router } from "express";
import passport, { AuthenticateOptions } from "passport";
import {
  handleLogin,
  handleNewCarer,
  handleNewOwner,
} from "../controllers/authController.js";

const authRouter = Router();

authRouter.post(
  "/login",
  passport.authenticate("login", { session: false }),
  handleLogin
);

authRouter.post("/owners", handleNewOwner);
authRouter.post("/carers", handleNewCarer);

export default authRouter;
