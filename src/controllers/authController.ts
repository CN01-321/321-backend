import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Request, Response } from "express";
import { WithId } from "mongodb";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? "";

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
