import { Router } from "express";
import passport, { AuthenticateOptions } from "passport";
import {
  handleLogin,
  handleNewCarer,
  handleNewOwner,
} from "../controllers/authController.js";

const authRouter = Router();

const authOptions: AuthenticateOptions = {
  session: false,
};

// return a jwt of the user's email and user type to the caller
authRouter.post(
  "/login",
  passport.authenticate("login", authOptions),
  handleLogin
);
authRouter.post("/owners", handleNewOwner);
authRouter.post("/carers", handleNewCarer);

authRouter.get(
  "/needs-user-token",
  passport.authenticate("user-jwt", authOptions),
  (req, res) => {
    res.send("got user message");
  }
);

authRouter.get(
  "/needs-owner-token",
  passport.authenticate("owner-jwt", authOptions),
  (req, res) => {
    res.send("got owner message");
  }
);

authRouter.get(
  "/needs-carer-token",
  passport.authenticate("carer-jwt", authOptions),
  (req, res) => {
    res.send("got carer message");
  }
);

export default authRouter;
