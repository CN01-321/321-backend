/**
 * @file Handles authentication routes
 * @author George Bull
 */

import { Router } from "express";
import passport from "passport";
import { handleLogin } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post(
  "/login",
  passport.authenticate("login", { session: false }),
  handleLogin
);

export default authRouter;
