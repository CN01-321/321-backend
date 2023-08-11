import { UserLocation } from "../models/user";

export interface UserUpdateForm {
  name?: string;
  location?: Omit<UserLocation, "type">;
  phone?: string;
  bio?: string;
}
