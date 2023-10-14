/**
 * @file Registers authentication middleware and controls auth routes.
 * @author George Bull
 */
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { NextFunction, Request, Response } from "express";
import { WithId } from "mongodb";
import passport from "passport";
import { Strategy as LocalStrategy, IStrategyOptions } from "passport-local";
import userService from "../services/userService.js";
import dotenv from "dotenv";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import ownerService from "../services/ownerService.js";
import carerService from "../services/carerService.js";
import { Carer } from "../models/carer.js";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? "";

const signUpOptions: IStrategyOptions = {
  usernameField: "email",
  passwordField: "password",
};

/**
 * Registers login middleware to verify the provided credentials exist in the
 * databse
 * @returns a validated user, or will result in a 401 error otherwise
 */
passport.use(
  "login",
  new LocalStrategy(signUpOptions, async (email, password, callback) => {
    console.debug("login", email, password);
    const user = await userService.getUserByEmail(email);

    if (!user || !(await userService.checkUserPassword(user, password))) {
      callback(null, false);
      return;
    }

    callback(null, user);
  })
);

const jwtOpts = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

/**
 * Registers middleware that checks that the given JWT exists in the database
 * and points to a user type
 * @returns the given user, or will result in a 401 error otherwise
 */
passport.use(
  "user-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const user = await userService.getUserByEmail(token.user.email);
    if (!user) return done(null, false);
    return done(null, user);
  })
);

/**
 * Registers middleware that checks that the given JWT exists in the database
 * and points to an owner
 * @returns the given owner, or will result in a 401 error otherwise
 */
passport.use(
  "owner-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const owner = await ownerService.getOwnerByEmail(token.user.email);
    if (!owner) return done(null, false);
    return done(null, owner);
  })
);

/**
 * Registers middleware that checks that the given JWT exists in the database
 * and points to a carer
 * @returns the given carer, or will result in a 401 error otherwise
 */
passport.use(
  "carer-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const carer = await carerService.getCarerByEmail(token.user.email);
    if (!carer) return done(null, false);
    return done(null, carer);
  })
);

/**
 * Validates that the user has enough information filled in to correctly operate
 * in the system.
 * @returns Will result in a 403 error if the user has not enough information
 */
export function validateUserHasInformation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userHasRequiredFields = (u: User) => u.name && u.location;
  const carerHasRequiredFields = (c: Carer) =>
    c.hourlyRate && c.preferredTravelDistance;

  const user = req.user as User;

  // check that a user has the required fields, and if the user is a carer, check
  // the required carer fields are present as well
  if (
    !userHasRequiredFields(user) &&
    !(user.userType === "carer" && !carerHasRequiredFields(user as Carer))
  ) {
    res.status(403).send("User has not filled out information");
    return;
  }

  next();
}

/**
 * Creates a new JWT to send back to the client.
 */
export async function handleLogin(req: Request, res: Response) {
  const user = req.user as WithId<User>;
  const body = { _id: user._id, email: user.email, type: user.userType };

  const token = jwt.sign({ user: body }, jwtSecret, {
    issuer: "pet-carer.com",
    noTimestamp: true,
  });

  res.json({ token });
}
