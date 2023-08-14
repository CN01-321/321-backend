import { ObjectSchema, number, object, string, tuple } from "yup";
import {
  UserLocation,
  UserType,
  getUserByEmail,
  getUserByEmailAndPassword,
  getUserById,
} from "../models/user.js";
import { newOwner } from "../models/owner.js";
import { newCarer } from "../models/carer.js";
import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../errors.js";

class UserService {
  async getUser(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new BadRequestError("User id is invalid");
    }

    const user = await getUserById(new ObjectId(userId));

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

  async newUser(newUserForm: NewUserForm, userType: UserType) {
    await validateNewUserForm(newUserForm);
    const newUser = userType === "owner" ? newOwner : newCarer;
    await newUser(newUserForm.email, newUserForm.password);
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
