import Express from "express";
import userService from "../services/userService.js";

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

const userController = {
  getUser,
};

export default userController;
