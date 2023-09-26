import { ObjectSchema, number, object, string, tuple } from "yup";
import {
  User,
  UserLocation,
  UserType,
  getNotifications,
  getUserByEmail,
  getUserByEmailAndPassword,
  getUserProfile,
  updateUserPfp,
} from "../models/user.js";
import { newOwner } from "../models/owner.js";
import { newCarer } from "../models/carer.js";
import { ObjectId, WithId } from "mongodb";
import {
  BadRequestError,
  NotFoundError,
  handleUpdateResult,
} from "../errors.js";
import imageStorageService, { ImageMetadata } from "./imageStorageService.js";

class UserService {
  async getUser(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new BadRequestError("User id is invalid");
    }

    const user = await getUserProfile(new ObjectId(userId));

    if (!user) {
      throw new NotFoundError("Could not find user");
    }

    return user;
  }

  async getUserByEmailAndPassword(email: string, password: string) {
    return await getUserByEmailAndPassword(email, password);
  }

  async getUserByEmail(email: string) {
    return await getUserByEmail(email);
  }

  async getUserNotifications(userId: string) {
    console.log(userId);

    if (!ObjectId.isValid(userId)) {
      throw new BadRequestError("User id is invalid");
    }

    return await getNotifications(new ObjectId(userId));
  }

  async newUser(newUserForm: NewUserForm, userType: UserType) {
    await validateNewUserForm(newUserForm);
    const newUser = userType === "owner" ? newOwner : newCarer;
    await newUser(newUserForm.email, newUserForm.password);
  }

  async setPfp(user: WithId<User>, metadata: ImageMetadata, image: Buffer) {
    // delete the current profile pick if one is set
    if (user.pfp) {
      await imageStorageService.deleteImage(user.pfp);
    }

    const imageId = await imageStorageService.storeImage(metadata, image);
    return handleUpdateResult(await updateUserPfp(user, imageId));
  }
}

const userService = new UserService();

export default userService;

export interface NewUserForm {
  email: string;
  password: string;
}

async function validateNewUserForm(form: NewUserForm) {
  const schema: ObjectSchema<NewUserForm> = object({
    email: string().email().required(),
    password: string().required(),
  });

  return await schema.validate(form);
}

export interface UserUpdateForm {
  name?: string;
  location?: Omit<UserLocation, "type">;
  phone?: string;
  bio?: string;
}

export const userUpdateFormSchema: ObjectSchema<UserUpdateForm> = object({
  name: string().optional(),
  location: object({
    coordinates: tuple([
      number().required().min(-180).max(180),
      number().required().min(-90).max(90),
    ]).required(),
    street: string().required(),
    city: string().required(),
    state: string().required(),
    postcode: string().required(),
  }).optional(),
  phone: string().optional(),
  bio: string().optional(),
});
