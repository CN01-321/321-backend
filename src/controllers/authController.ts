import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Request, Response } from "express";
import { WithId } from "mongodb";
import passport from "passport";
import { Strategy as LocalStrategy, IStrategyOptions } from "passport-local";
import userService from "../services/userService.js";
import dotenv from "dotenv";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import ownerService from "../services/ownerService.js";
import carerService from "../services/carerService.js";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? "";

const signUpOptions: IStrategyOptions = {
  usernameField: "email",
  passwordField: "password",
};

// set up middleware to verify that a user's email and password exisits in the system
// return the user to the next function ('/login') or fail (returning 401 to the caller)
passport.use(
  "login",
  new LocalStrategy(signUpOptions, async (email, password, callback) => {
    console.debug("login", email, password);
    const user = await userService.getUserByEmailAndPassword(email, password);
    return user ? callback(null, user) : callback(null, false);
  })
);

const jwtOpts = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

// sets up jwt middleware for routes that require a user to be logged in
// decodes the given token and if valid it tries to find the user associated with the email
// passes that user to the next function, or otherwilse returns a 401 to the caller
passport.use(
  "user-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const user = await userService.getUserByEmail(token.user.email);
    if (!user) return done(null, false);
    return done(null, user);
  })
);

passport.use(
  "owner-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const owner = await ownerService.getOwnerByEmail(token.user.email);
    if (!owner) return done(null, false);
    return done(null, owner);
  })
);

passport.use(
  "carer-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const carer = await carerService.getCarerByEmail(token.user.email);
    if (!carer) return done(null, false);
    return done(null, carer);
  })
);
export async function handleLogin(req: Request, res: Response) {
  const user = req.user as WithId<User>;
  console.debug(user._id);
  const body = { _id: user._id, email: user.email, type: user.userType };

  console.debug(body);

  const token = jwt.sign({ user: body }, jwtSecret, {
    issuer: "pet-carer.com",
    noTimestamp: true,
  });

  console.debug(token);
  res.json({ token });
}
