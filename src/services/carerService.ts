import { ObjectId, WithId } from "mongodb";
import {
  Carer,
  acceptBroadOffer,
  acceptDirectOffer,
  getCarerByEmail,
  getCarerJobs,
  getCarerOffers,
  rejectBroadOffer,
  rejectDirectOffer,
  updateCarerDetails,
} from "../models/carer.js";
import { UserUpdateForm, userUpdateFormSchema } from "./userService.js";
import { PetSize, PetType, petSizes, petTypes } from "../models/pet.js";
import { ObjectSchema, array, number, object, string } from "yup";
import { UserLocation } from "../models/user.js";
import { BadRequestError, handleUpdateResult } from "../errors.js";
import notificationService from "./notificationService.js";

class CarerService {
  async getCarerByEmail(email: string) {
    return await getCarerByEmail(email);
  }

  async updateCarer(carer: WithId<Carer>, updateCarerForm: UpdateCarerForm) {
    await validateUpdateCarerForm(updateCarerForm);

    const location: UserLocation | undefined = updateCarerForm.location
      ? { ...updateCarerForm.location, type: "Point" }
      : undefined;

    const updateCarer: Partial<Carer> = { ...updateCarerForm, location };
    handleUpdateResult(await updateCarerDetails(carer._id, updateCarer));
  }

  async getBroadOffers(carer: WithId<Carer>) {
    return await getCarerOffers(carer, "broad");
  }

  async getDirectOffers(carer: WithId<Carer>) {
    return await getCarerOffers(carer, "direct");
  }

  async getJobs(carer: WithId<Carer>) {
    return await getCarerJobs(carer);
  }

  async acceptOffer(carer: WithId<Carer>, offerId: string, offerType: string) {
    if (!ObjectId.isValid(offerId)) {
      throw new BadRequestError("Offer id is invalid");
    }

    if (offerType !== "broad" && offerType !== "direct") {
      throw new BadRequestError("Invalid offer type");
    }

    if (offerType === "direct") {
      await notificationService.pushCarerAcceptedDirect(
        new ObjectId(offerId),
        carer
      );
    }

    const accept = offerType === "broad" ? acceptBroadOffer : acceptDirectOffer;
    handleUpdateResult(await accept(carer, new ObjectId(offerId)));
  }

  async rejectOffer(carer: WithId<Carer>, offerId: string, offerType: string) {
    if (!ObjectId.isValid(offerId)) {
      throw new BadRequestError("Offer id is invalid");
    }

    if (offerType !== "broad" && offerType !== "direct") {
      throw new BadRequestError("Invalid offer type");
    }

    const reject = offerType === "broad" ? rejectBroadOffer : rejectDirectOffer;
    handleUpdateResult(await reject(carer, new ObjectId(offerId)));
  }
}

const carerService = new CarerService();

export default carerService;

export interface UpdateCarerForm extends UserUpdateForm {
  skillsAndExp?: string;
  preferredTravelDistance?: number;
  hourlyRate?: number;
  preferredPetTypes?: PetType[];
  preferredPetSizes?: PetSize[];
}

async function validateUpdateCarerForm(form: UpdateCarerForm) {
  const schema: ObjectSchema<UpdateCarerForm> = object({
    skillsAndExp: string().optional(),
    preferredTravelDistance: number().optional(),
    hourlyRate: number().min(0).optional(),
    preferredPetTypes: array()
      .of(string<PetType>().required())
      .max(petTypes.length)
      .optional(),
    preferredPetSizes: array()
      .of(string<PetSize>().required())
      .max(petSizes.length)
      .optional(),
  }).concat(userUpdateFormSchema);

  await schema.validate(form);
}
