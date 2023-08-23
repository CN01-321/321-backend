import Express from "express";
import imageStorageService, {
  ImageType,
} from "../services/imageStorageService.js";

async function storeImage(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  // bodyParser will fail if content type is not a supported image type so
  // content-type will always be a known image type
  const metadata = {
    imageType: req.headers["content-type"] as ImageType,
  };

  try {
    res.json(await imageStorageService.storeImage(metadata, req.body));
  } catch (err) {
    next(err);
  }
}

async function getImage(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    const imageResult = await imageStorageService.getImage(req.params.imageId);
    res.setHeader("Content-Type", imageResult.imageType);
    imageResult.image.pipe(res);
  } catch (err) {
    next(err);
  }
}
const imageController = {
  storeImage,
  getImage,
};

export default imageController;
