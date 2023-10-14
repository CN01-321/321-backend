/**
 * @file Manages owner and owner's pets functionality
 * @author George Bull
 */

import { ObjectId, WithId } from "mongodb";
import { Owner, getOwnerByEmail, updateOwnerDetails } from "../models/owner.js";
import { object, string, ObjectSchema, bool } from "yup";
import {
  Pet,
  PetSize,
  PetType,
  checkOwnerPetExists,
  createNewPet,
  deleteExisitingPet,
  getOwnerPets,
  setPetPfp,
  updateExisitingPet,
} from "../models/pet.js";
import { UserUpdateForm, userUpdateFormSchema } from "./userService.js";
import { UserLocation } from "../models/user.js";
import {
  BadRequestError,
  NotFoundError,
  handleUpdateResult,
} from "../errors.js";
import imageStorageService, { ImageMetadata } from "./imageStorageService.js";
import { getTopNearbyCarers } from "../models/carer.js";

class OwnerService {
  async getOwnerByEmail(email: string) {
    return await getOwnerByEmail(email);
  }

  async updateOwner(owner: WithId<Owner>, updateFormData: OwnerUpdateForm) {
    const updateForm = await validateOwnerUpdateForm(updateFormData);

    // include GeoJSON type: "Point" if location is being set,
    // otherwise leave location undefined
    const location: UserLocation | undefined = updateForm.location
      ? { ...updateForm.location, type: "Point" }
      : undefined;

    const updateOwner: Partial<Owner> = { ...updateForm, location };
    handleUpdateResult(await updateOwnerDetails(owner._id, updateOwner));
  }

  async getHomeOverview(owner: WithId<Owner> & { location: UserLocation }) {
    return {
      name: owner.name,
      completed: owner.requests.filter((r) => r.status === "completed").length,
      pending: owner.requests.filter((r) => r.status === "pending").length,
      current: owner.requests.filter((r) => r.status === "accepted").length,
      topCarers: await getTopNearbyCarers(owner.location),
    };
  }

  async getPets(owner: WithId<Owner>) {
    return await getOwnerPets(owner);
  }

  async addPet(owner: WithId<Owner>, addPetForm: AddPetForm) {
    await validateAddPetForm(addPetForm);

    const petId = new ObjectId();
    const pet: Pet = { ...addPetForm, _id: petId, feedback: [] };
    handleUpdateResult(await createNewPet(owner, pet));

    return petId;
  }

  async updatePet(
    owner: WithId<Owner>,
    petId: string,
    updatePet: UpdatePetForm
  ) {
    await validateUpdatePetForm(updatePet);

    if (!ObjectId.isValid(petId)) {
      throw new BadRequestError("Pet Id is invalid");
    }

    return handleUpdateResult(
      await updateExisitingPet(owner, new ObjectId(petId), updatePet)
    );
  }

  async deletePet(owner: WithId<Owner>, petId: string) {
    if (!ObjectId.isValid(petId)) {
      throw new BadRequestError("Pet Id is invalid");
    }

    return handleUpdateResult(
      await deleteExisitingPet(owner, new ObjectId(petId))
    );
  }

  async setPetPfp(
    owner: WithId<Owner>,
    petId: string,
    metadata: ImageMetadata,
    image: Buffer
  ) {
    if (!ObjectId.isValid(petId)) {
      throw new BadRequestError("Pet Id is invalid");
    }

    const petExists = await checkOwnerPetExists(owner, new ObjectId(petId));
    // check the pet exists first before storing image
    if (!petExists) {
      throw new NotFoundError("Owner does not have a pet with that id");
    }

    const imageId = await imageStorageService.storeImage(metadata, image);

    return handleUpdateResult(
      await setPetPfp(owner, new ObjectId(petId), imageId)
    );
  }
}

const ownerService = new OwnerService();

export default ownerService;

export type OwnerUpdateForm = UserUpdateForm;

async function validateOwnerUpdateForm(
  form: OwnerUpdateForm
): Promise<OwnerUpdateForm> {
  const schema: ObjectSchema<OwnerUpdateForm> = userUpdateFormSchema;
  return await schema.validate(form);
}

export interface AddPetForm {
  name: string;
  petType: PetType;
  petSize: PetSize;
  isVaccinated: boolean;
  isFriendly: boolean;
  isNeutered: boolean;
}

async function validateAddPetForm(form: AddPetForm) {
  const schema: ObjectSchema<AddPetForm> = object({
    name: string().required(),
    petType: string<PetType>().required(),
    petSize: string<PetSize>().required(),
    isVaccinated: bool().required(),
    isFriendly: bool().required(),
    isNeutered: bool().required(),
  });

  return await schema.validate(form);
}

export interface UpdatePetForm {
  name?: string;
  petType?: PetType;
  petSize?: PetSize;
  isVaccinated?: boolean;
  isFriendly?: boolean;
  isNeutered?: boolean;
}

async function validateUpdatePetForm(form: UpdatePetForm) {
  const schema: ObjectSchema<UpdatePetForm> = object({
    name: string().optional(),
    petType: string<PetType>().optional(),
    petSize: string<PetSize>().optional(),
    isVaccinated: bool().optional(),
    isFriendly: bool().optional(),
    isNeutered: bool().optional(),
  });

  return await schema.validate(form);
}
