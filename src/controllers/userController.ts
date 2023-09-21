import Express from "express";
import userService from "../services/userService.js";
import { ImageType } from "../services/imageStorageService.js";
import { User } from "../models/user.js";
import { WithId } from "mongodb";

async function getUser(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    res.json(await userService.getUser(req.params.userId));
  } catch (err) {
    next(err);
  }
}

async function getUserNotifications(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const user = req.user as WithId<User>;
  console.log("user is: ", user);
  try {
    res.json(await userService.getUserNotifications(user._id.toString()));
  } catch (err) {
    next(err);
  }
}
async function setPfp(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const user = req.user as WithId<User>;
  console.log("setting pfp");

  const metadata = {
    imageType: req.headers["content-type"] as ImageType,
  };

  try {
    res.json(await userService.setPfp(user, metadata, req.body));
  } catch (err) {
    next(err);
  }
}

const userController = {
  getUser,
  getUserNotifications,
  setPfp,
};

export default userController;
