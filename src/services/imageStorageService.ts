/**
 * @file Defines ImageStorage interface and mediates between controller and
 * concrete implementations of ImageStorage
 * @author George Bull
 */

import { Readable } from "stream";
import gridfsStorageService from "./gridfsService.js";

export type ImageType = "image/jpeg" | "image/png";

export interface ImageResult {
  image: Readable;
  imageType: ImageType;
}

export interface ImageMetadata extends Record<string, string> {
  imageType: ImageType;
}

export interface ImageStorage {
  storeImage: (
    metadata: ImageMetadata,
    image: Buffer,
    filename?: string
  ) => Promise<string>;
  getImage: (id: string) => Promise<ImageResult>;
  getImageIds: (query: Record<string, string>) => Promise<string[]>;
  deleteImage: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
}

class ImageStorageService {
  private imageStorage: ImageStorage;

  constructor(imageStorage: ImageStorage) {
    this.imageStorage = imageStorage;
  }

  async storeImage(imageType: ImageMetadata, image: Buffer, filename?: string) {
    return await this.imageStorage.storeImage(imageType, image, filename);
  }

  async getImage(id: string) {
    return await this.imageStorage.getImage(id);
  }

  async getImageIds(query: Record<string, string>): Promise<string[]> {
    return await this.imageStorage.getImageIds(query);
  }

  async deleteImage(id: string) {
    await this.imageStorage.deleteImage(id);
  }

  async deleteAll() {
    await this.imageStorage.deleteAll();
  }
}

const imageStorageService = new ImageStorageService(gridfsStorageService);

export default imageStorageService;
