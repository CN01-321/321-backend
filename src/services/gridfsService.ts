import { getDatabase } from "../mongo.js";
import { GridFSBucket, ObjectId } from "mongodb";
import { ImageMetadata, ImageStorage } from "./imageStorageService.js";
import { NotFoundError } from "../errors.js";

const imageBucket = new GridFSBucket(await getDatabase(), {
  bucketName: "ImageBucket",
});

class GridFSStorageService implements ImageStorage {
  async storeImage(metadata: ImageMetadata, image: Buffer, filename?: string) {
    // upload the file to gridfs and wait for the finished event to resolve
    const uploadImage: () => Promise<ObjectId> = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = imageBucket.openUploadStream(filename ?? "image", {
          metadata,
        });

        // set up listeners that resolve or reject the promise
        uploadStream.addListener("finish", () => resolve(uploadStream.id));
        uploadStream.addListener("error", () =>
          reject(new Error("Could not upload image to database"))
        );

        uploadStream.write(image);
        uploadStream.end();
      });
    };

    // await the id of the uploaded image
    return (await uploadImage()).toString();
  }

  async getImage(id: string) {
    const imageId = new ObjectId(id);

    const cursor = await imageBucket.find({ _id: imageId });
    const fileMetadata = await cursor.next();

    if (!fileMetadata) {
      throw new NotFoundError("Could not find image");
    }

    const imageType = fileMetadata?.metadata?.imageType;

    if (!imageType) {
      throw new Error("Image metadata not present");
    }

    const image = imageBucket.openDownloadStream(imageId);

    return { image, imageType };
  }

  async getImageIds(query: Record<string, string>) {
    // maps the query into a new object that has "metadata.QUERY_KEY" as the keys
    const metadataQuery = Object.fromEntries(
      Object.entries(query).map(([k, v]) => ["metadata." + k, v])
    );

    const cursor = await imageBucket.find(metadataQuery);

    return (await cursor.toArray()).map((file) => file._id.toString());
  }

  async deleteImage(id: string) {
    await imageBucket.delete(new ObjectId(id));
  }

  async deleteAll() {
    await imageBucket.drop();
  }
}

const gridfsStorageService = new GridFSStorageService();

export default gridfsStorageService;
