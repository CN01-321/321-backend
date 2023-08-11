import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as LocalStrategy, IStrategyOptions } from "passport-local";
import {
  User,
  checkEmailExists,
  getUserByEmail,
  getUserByEmailAndPassword,
} from "../models/user.js";
import { getOwnerByEmail, newOwner } from "../models/owner.js";
import { Request, Response } from "express";
import { getCarerByEmail, newCarer } from "../models/carer.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { WithId } from "mongodb";

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
    console.log("login", email, password);
    const user = await getUserByEmailAndPassword(email, password);
    return user ? callback(null, user) : callback(null, false);
  })
);

export async function handleLogin(req: Request, res: Response) {
  const user = req.user as WithId<User>;
  console.log(user._id);
  const body = { _id: user._id, email: user.email, type: user.userType };

  console.log(body);

  const token = jwt.sign({ user: body }, jwtSecret, {
    issuer: "pet-carer.com",
    noTimestamp: true,
  });

  console.log(token);
  res.json({ token });
}

// TODO more stricter validation (proper emails, stronger passwords)
async function valdateSignUpRequest(
  email: string | undefined,
  password: string | undefined
) {
  if (!email) {
    throw "No email present";
  }

  if (!password) {
    throw "No password present";
  }

  if (await checkEmailExists(email)) {
    throw "Email is already in use.";
  }
}

export async function handleNewOwner(req: Request, res: Response) {
  const email = req.body.email;
  const password = req.body.password;

  try {
    await valdateSignUpRequest(email, password);
    const owner = await newOwner(email, password);
    console.log("Created new Owner", owner);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function handleNewCarer(req: Request, res: Response) {
  const email = req.body.email;
  const password = req.body.password;

  try {
    await valdateSignUpRequest(email, password);
    const carer = await newCarer(email, password);
    console.log("Created new Carer", carer);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).send(e);
  }
}

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
    const user = await getUserByEmail(token.user.email);
    if (!user) return done(null, false);
    return done(null, user);
  })
);

passport.use(
  "owner-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const owner = await getOwnerByEmail(token.user.email);
    if (!owner) return done(null, false);
    return done(null, owner);
  })
);

passport.use(
  "carer-jwt",
  new JwtStrategy(jwtOpts, async (token, done) => {
    const carer = await getCarerByEmail(token.user.email);
    if (!carer) return done(null, false);
    return done(null, carer);
  })
);
