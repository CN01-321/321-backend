import Express from "express";
import { ObjectId } from "mongodb";
import { getUserById } from "../models/user.js";

async function getUser(req: Express.Request, res: Express.Response) {
  if (!ObjectId.isValid(req.params.userId)) {
    res.status(400).send("userId is invalid");
    return;
  }

  res.json(await getUserById(new ObjectId(req.params.userId)));
}

const userController = {
  getUser,
};

export default userController;
