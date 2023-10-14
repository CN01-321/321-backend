/**
 * @file Manages carer related functionality
 * @author George Bull
 */

import { ObjectId, WithId } from "mongodb";
import {
  Carer,
  acceptBroadOffer,
  acceptDirectOffer,
  completeOffer,
  getCarerByEmail,
  getCarerJobs,
  getCarerOffers,
  getTopNearbyCarers,
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

    // append the GeoJSON type onto the location if the location has been given
    const location: UserLocation | undefined = updateCarerForm.location
      ? { ...updateCarerForm.location, type: "Point" }
      : undefined;

    const updateCarer: Partial<Carer> = { ...updateCarerForm, location };
    handleUpdateResult(await updateCarerDetails(carer._id, updateCarer));
  }

  async getHomeOverview(carer: WithId<Carer> & { location: UserLocation }) {
    return {
      name: carer.name,
      completed: carer.offers.filter((r) => r.status === "accepted").length,
      pending: carer.offers.filter((r) => r.status == "pending").length,
      current: carer.offers.filter((r) => r.status === "applied").length,
      // get the first 10 most recent reviews of this carer
      recentReviews: carer.feedback
        .sort((f1, f2) => f2.postedOn.getTime() - f1.postedOn.getTime())
        .slice(0, 10),
      topCarers: await getTopNearbyCarers(carer.location),
    };
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

    // send notification to the owner if this is accepting their direct request
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

  async completeCarerOffer(carer: WithId<Carer>, offerId: string) {
    if (!ObjectId.isValid(offerId)) {
      throw new BadRequestError("Offer id is invalid");
    }

    handleUpdateResult(await completeOffer(carer, new ObjectId(offerId)));
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
