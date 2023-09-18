import { ObjectId, UpdateResult, WithId } from "mongodb";
import { Feedback } from "./feedback.js";
import { Owner } from "./owner.js";
import { ownerCollection } from "../mongo.js";

export type PetType = "dog" | "cat" | "bird" | "rabbit";
export const petTypes: PetType[] = ["dog", "cat", "bird", "rabbit"];

export type PetSize = "small" | "medium" | "large";
export const petSizes: PetSize[] = ["small", "medium", "large"];

export interface Pet {
  _id: ObjectId;
  name: string;
  petType: PetType;
  petSize: PetSize;
  isVaccinated: boolean;
  isFriendly: boolean;
  isNeutered: boolean;
  pfp?: string;
  feedback: Feedback[];
}

export async function getPetWithId(petId: ObjectId): Promise<Pet | null> {
  const res = await ownerCollection.aggregate([
    { $unwind: "$pets" },
    { $match: { "pets._id": petId } },
  ]);
  const pet = await res.next();
  return pet?.pets as Pet | null;
}

export type PetDTO = Omit<Pet, "feedback">;

export async function getOwnerPets(owner: WithId<Owner>): Promise<PetDTO[]> {
  const res = await ownerCollection.aggregate([
    { $match: { _id: owner._id } },
    { $unwind: "$pets" },
    { $replaceWith: "$pets" },
    { $project: { feedback: 0 } },
  ]);

  return (await res.toArray()) as PetDTO[];
}

export async function checkOwnerPetExists(
  owner: WithId<Owner>,
  petId: ObjectId
): Promise<boolean> {
  const count = await ownerCollection.countDocuments({
    _id: owner._id,
    "pets._id": petId,
  });

  return count > 0;
}

export async function createNewPet(
  owner: WithId<Owner>,
  pet: Pet
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { _id: owner._id },
    { $push: { pets: pet } }
  );
}

export async function updateExisitingPet(
  owner: WithId<Owner>,
  petId: ObjectId,
  pet: Omit<Partial<Pet>, "_id">
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { _id: owner._id, "pets._id": petId },
    {
      $set: {
        "pets.$.name": pet.name,
        "pets.$.petType": pet.petType,
        "pets.$.petSize": pet.petSize,
        "pets.$.isVaccinated": pet.isVaccinated,
        "pets.$.isFriendly": pet.isFriendly,
        "pets.$.isNeutered": pet.isNeutered,
      },
    }
  );
}

export async function deleteExisitingPet(
  owner: WithId<Owner>,
  petId: ObjectId
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { _id: owner._id },
    { $pull: { pets: { _id: petId } } }
  );
}

export async function setPetPfp(
  owner: WithId<Owner>,
  petId: ObjectId,
  imageId: string
): Promise<UpdateResult<Owner>> {
  return await ownerCollection.updateOne(
    { _id: owner._id, "pets._id": petId },
    { $set: { "pets.$.pfp": imageId } }
  );
}
