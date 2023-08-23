import { Router } from "express";
import passport from "passport";
import bodyParser from "body-parser";
import imageController from "../controllers/imageController.js";

const imageRouter = Router();

imageRouter.post(
  "/",
  passport.authenticate("user-jwt", { session: false }),
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "20mb" }),
  imageController.storeImage
);

imageRouter.get("/:imageId", imageController.getImage);

export default imageRouter;
