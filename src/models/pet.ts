import { ObjectId, WithId } from "mongodb";
import { Feedback } from "./feedback.js";
import { getCollection } from "../mongo.js";
import { Owner } from "./owner.js";

export type PetType = "dog" | "cat" | "bird" | "rabbit";
export const petTypes = ["dog", "cat", "bird", "rabbit"];

export type PetSize = "small" | "medium" | "large";
export const petSizes = ["small", "medium", "large"];

export interface Pet {
  _id?: ObjectId;
  name: string;
  petType: PetType;
  petSize: PetSize;
  isVaccinated: boolean;
  isFriendly: boolean;
  isNeutered: boolean;
  profilePicture?: string;
  feedback?: Array<Feedback>;
}

export async function getPetWithId(petId: ObjectId): Promise<Pet | null> {
  const ownerCollection = await getCollection<Owner>();
  const res = await ownerCollection.aggregate([
    { $unwind: "$pets" },
    { $match: { "pets._id": petId } },
  ]);
  const pet = await res.next();

  return pet?.pets as Pet;
}

export async function checkOwnerPetExists(
  owner: WithId<Owner>,
  petId: ObjectId
) {
  const ownerCollection = await getCollection<Owner>();
  const count = await ownerCollection.countDocuments({
    _id: owner._id,
    "pets._id": petId,
  });

  return count > 0;
}

export async function createNewPet(owner: WithId<Owner>, pet: Pet) {
  pet._id = new ObjectId();
  const ownerCollection = await getCollection<Owner>();
  await ownerCollection.updateOne({ _id: owner._id }, { $push: { pets: pet } });
  return pet;
}

export async function updateExisitingPet(owner: WithId<Owner>, pet: Pet) {
  const ownerCollection = await getCollection<Owner>();


  await ownerCollection.updateOne(
    { _id: owner._id, "pets._id": pet._id },
    { $set: { "pets.$": pet } }
  );

  console.log(pet._id, await ownerCollection.findOne({"pets._id": pet._id! }))

  return await getPetWithId(pet._id!)!;
}

export async function deleteExisitingPet(
  owner: WithId<Owner>,
  petId: ObjectId
) {
  const ownerCollection = await getCollection<Owner>();
  await ownerCollection.updateOne(
    { _id: owner._id },
    { $pull: { pets: { _id: petId } } }
  );
}
