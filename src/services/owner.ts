import { ObjectId, WithId } from "mongodb";
import { Owner, updateOwnerDetails } from "../models/owner";
import { object, number, string, ObjectSchema, tuple, mixed, bool } from "yup";
import {
  Pet,
  PetSize,
  PetType,
  createNewPet,
  deleteExisitingPet,
  getOwnerPets,
  updateExisitingPet,
} from "../models/pet";
import { UserUpdateForm } from "./user";
import { UserLocation } from "../models/user";
import { BadRequestError, handleUpdateResult } from "../errors";

class OwnerService {
  async updateOwner(ownerId: ObjectId, updateFormData: OwnerUpdateForm) {
    const updateForm = await validateOwnerUpdateForm(updateFormData);

    // include type = "Point" if location is being set, otherwise leave location undefined
    const location: UserLocation | undefined = updateForm.location
      ? { ...updateForm.location, type: "Point" }
      : undefined;

    const updateOwner: Partial<Owner> = { ...updateForm, location };
    return await updateOwnerDetails(ownerId, updateOwner);
  }

  async getPets(owner: WithId<Owner>) {
    return await getOwnerPets(owner);
  }

  async addPet(owner: WithId<Owner>, addPetForm: AddPetForm) {
    await validateAddPetForm(addPetForm);

    const pet: Pet = { ...addPetForm, feedback: [] };
    handleUpdateResult(await createNewPet(owner, pet));
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
}

const ownerService = new OwnerService();

export default ownerService;

// TODO move user update form into user service
type OwnerUpdateForm = UserUpdateForm;

async function validateOwnerUpdateForm(
  form: OwnerUpdateForm
): Promise<OwnerUpdateForm> {
  const schema: ObjectSchema<OwnerUpdateForm> = object({
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

  return await schema.validate(form);
}

interface AddPetForm {
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
    petType: mixed<PetType>().required(),
    petSize: mixed<PetSize>().required(),
    isVaccinated: bool().required(),
    isFriendly: bool().required(),
    isNeutered: bool().required(),
  });

  return await schema.validate(form);
}

interface UpdatePetForm {
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
    petType: mixed<PetType>().optional(),
    petSize: mixed<PetSize>().optional(),
    isVaccinated: bool().optional(),
    isFriendly: bool().optional(),
    isNeutered: bool().optional(),
  });

  return await schema.validate(form);
}
