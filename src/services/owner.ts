import { ObjectId, WithId } from "mongodb";
import { Owner, OwnerUpdateForm, updateOwnerDetails } from "../models/owner";
import { object, array, number, string, ObjectSchema, tuple, mixed } from "yup";
import { getOwnerPets } from "../models/pet";

class OwnerService {
  async updateOwner(ownerId: ObjectId, updateFormData: any) {
    const updateForm = await validateOwnerUpdateForm(updateFormData);
    return await updateOwnerDetails(ownerId, updateForm);
  }

  async getPets(owner: WithId<Owner>) {
    return await getOwnerPets(owner);
  }

  async getPet(petId:)
}

async function validateOwnerUpdateForm(form: any): Promise<OwnerUpdateForm> {
  if (form.location) {
    form.location.type = "Point";
  }

  const schema: ObjectSchema<OwnerUpdateForm> = object({
    name: string().optional(),
    location: object({
      type: mixed<"Point">().required(),
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

const ownerService = new OwnerService();

export default ownerService;
