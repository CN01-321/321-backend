import { ObjectId, WithId } from "mongodb";
import { Owner, updateOwnerDetails } from "../models/owner";
import { object, string, ObjectSchema, mixed, bool } from "yup";
import {
  Pet,
  PetSize,
  PetType,
  createNewPet,
  deleteExisitingPet,
  getOwnerPets,
  updateExisitingPet,
} from "../models/pet";
import { UserUpdateForm, userUpdateFormSchema } from "./user";
import { UserLocation } from "../models/user";
import { BadRequestError, handleUpdateResult } from "../errors";

class OwnerService {
  async updateOwner(owner: WithId<Owner>, updateFormData: OwnerUpdateForm) {
    const updateForm = await validateOwnerUpdateForm(updateFormData);

    // include type = "Point" if location is being set, otherwise leave location undefined
    const location: UserLocation | undefined = updateForm.location
      ? { ...updateForm.location, type: "Point" }
      : undefined;

    const updateOwner: Partial<Owner> = { ...updateForm, location };
    handleUpdateResult(await updateOwnerDetails(owner._id, updateOwner));
  }

  async getPets(owner: WithId<Owner>) {
    return await getOwnerPets(owner);
  }

  async addPet(owner: WithId<Owner>, addPetForm: AddPetForm) {
    await validateAddPetForm(addPetForm);

    const pet: Pet = { ...addPetForm, _id: new ObjectId(), feedback: [] };
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
  const schema: ObjectSchema<OwnerUpdateForm> = userUpdateFormSchema;
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
