import { ObjectId } from "mongodb";
import { ownerCollection } from "../mongo.js";
import { Pet } from "./pet.js";
import { Request } from "./request.js";
import { User, UserUpdateForm } from "./user.js";

export interface Owner extends User {
  pets: Array<Pet>;
  requests: Array<Request>;
}

export interface OwnerUpdateForm extends UserUpdateForm {}

export async function newOwner(email: string, password: string) {
  return ownerCollection.insertOne({
    email,
    password,
    userType: "owner",
    notifications: [],
    feedback: [],
    pets: [],
    requests: [],
  });
}

export async function getOwnerByEmail(email: string) {
  return await ownerCollection.findOne({ email, userType: "owner" });
}

export async function updateOwnerDetails(ownerId: ObjectId, form: OwnerUpdateForm) {
  const updatedFields: any = {};
  
  if (form.name) {
    updatedFields.name = form.name;
  }
  if (form.email) {
    updatedFields.email = form.email;
  }
  if (form.coords && form.street && form.city && form.state && form.postcode) {
    updatedFields.location = {
      type: "Point",
      coordinates: form.coords,
      street: form.street,
      city: form.city,
      state: form.state,
      postcode: form.postcode
    }
  }
  if (form.phone) {
    updatedFields.phone = form.phone;
  }
  if (form.bio) {
    updatedFields.bio = form.bio;
  }
  if (form.pfp) {}

  await ownerCollection.updateOne(
    { _id: new ObjectId(ownerId) },
    { $set: updatedFields }
  );
}
