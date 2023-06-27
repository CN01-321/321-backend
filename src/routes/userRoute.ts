import { Router } from "express"
import userController from "../controllers/userController.js";

const userRouter = Router();

userRouter.get("/user/:id", userController.getById);

export default userRouter;