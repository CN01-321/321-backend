/**
 * @file Manges pet specific functionality
 * @author George Bull
 */

import { ObjectId } from "mongodb";
import { BadRequestError } from "../errors.js";
import { getPetWithId } from "../models/pet.js";

class PetService {
  async getPet(petId: string) {
    if (!ObjectId.isValid(petId)) {
      throw new BadRequestError("Pet id is invalid");
    }

    return await getPetWithId(new ObjectId(petId));
  }
}

const petService = new PetService();

export default petService;
