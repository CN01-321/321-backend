import Express from "express";
import { ObjectId, WithId } from "mongodb";
import { Owner } from "../models/owner.js";
import {
  Pet,
  createNewPet,
  updateExisitingPet,
  petSizes,
  petTypes,
  checkOwnerPetExists,
  deleteExisitingPet,
  getPetWithId,
} from "../models/pet.js";
import { Request, createNewRequest, updateRequest } from "../models/request.js";
import { handleControllerError } from "../util.js";
import { getCarerById } from "../models/carer.js";

async function getOwnerBySession(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    res.json(req.user as WithId<Owner>);
  } catch (err) {
    console.error(
      "The following error occured while getting an owner by session: " + err
    );
    next(err);
  }
}

async function getPet(req: Express.Request, res: Express.Response) {
  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("Invalid petId");
    return;
  }

  const pet = await getPetWithId(new ObjectId(req.params.petId));
  console.log(req.params.id, pet);

  res.json(pet);
}

function validatePet(pet: any): Pet {
  // TODO more validation
  console.log("validated: ", pet);

  if (!pet.name) throw new Error("Name is empty");

  const petTypeFound = petTypes.find((t) => t === pet.petType);
  if (!petTypeFound) throw new Error("Invalid pet type");

  const petSizeFound = petSizes.find((s) => s === pet.petSize);
  if (!petSizeFound) throw new Error("Invalid pet size");

  return pet as Pet;
}

async function addPet(req: Express.Request, res: Express.Response) {
  console.log(req.body);
  const owner = req.user as WithId<Owner>;
  const petData = {
    name: req.body.name,
    petType: req.body.petType,
    petSize: req.body.petSize,
    isVaccinated: req.body.isVaccinated ?? false,
    isFriendly: req.body.isFriendly ?? false,
    isNeutered: req.body.isNeutered ?? false,
    feedback: [],
  };

  try {
    const pet = validatePet(petData);
    res.json(await createNewPet(owner, pet));
  } catch (err) {
    handleControllerError(res, err, 400);
  }
}

async function updatePet(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;

  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("Invalid petId");
    return;
  }

  const petId = new ObjectId(req.params.petId);
  console.log(req.params.petId);

  if (!checkOwnerPetExists(owner, petId)) {
    res.status(404).send("Pet not found for owner");
    return;
  }

  const petData = {
    _id: petId,
    name: req.body.name,
    petType: req.body.petType,
    petSize: req.body.petSize,
    isVaccinated: req.body.isVaccinated ?? false,
    isFriendly: req.body.isFriendly ?? false,
    isNeutered: req.body.isNeutered ?? false,
  };

  try {
    const pet = validatePet(petData);
    res.json(await updateExisitingPet(owner, pet));
  } catch (err) {
    handleControllerError(res, err, 400);
  }
}

async function deletePet(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;
  const petId = new ObjectId(req.params.petId);

  if (!checkOwnerPetExists(owner, petId)) {
    res.status(404).send("Pet not found for owner");
    return;
  }

  try {
    await deleteExisitingPet(owner, petId);
    res.sendStatus(200);
  } catch (err) {
    handleControllerError(res, err);
  }
}

function validateDateRange(dateRange: any) {
  // if the start date is undefined or in the past then throw error
  console.log(new Date(dateRange.startDate), new Date());
  if (
    dateRange.startDate === undefined ||
    new Date(dateRange.startDate) < new Date()
  ) {
    throw new Error("Start date is invalid");
  }

  if (dateRange.duration === undefined || dateRange.duration < 1) {
    throw new Error("Duration is invalid");
  }
}

async function validateRequest(request: any): Promise<Request> {
  // if carer is present then check if the id is valid and if the carer exisits
  if (request.carer) {
    if (!ObjectId.isValid(request.carer)) {
      throw new Error("Carer id is invalid");
    }

    if (!getCarerById(new ObjectId(request.carer))) {
      throw new Error("Carer does not exist");
    }
  }

  if (!request.pets) {
    throw new Error("No Pets Specified");
  }

  validateDateRange(request.dateRange);

  return request as Request;
}

async function createRequest(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;
  const requestData = {
    isCompleted: false,
    pets: req.body.pets,
    requestedOn: new Date(),
    dateRange: req.body.dateRange,
  };

  try {
    const request = await validateRequest(requestData);
    res.json(await createNewRequest(owner, request));
  } catch (err) {
    handleControllerError(res, err, 400);
  }
}

async function editRequest(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;

  if (!ObjectId.isValid(req.params.requestId)) {
    res.status(400).send("Invalid request id");
    return;
  }

  const requestData = {
    _id: new ObjectId(req.params.requestId),
    carer: req.body.carer,
    pets: req.body.pets,
    dateRange: req.body.dateRange,
  };

  try {
    const request = await validateRequest(requestData);
    res.json(await updateRequest(owner, request));
  } catch (err) {
    handleControllerError(res, err, 400);
  }
}

// TODO discuss if delete should be more like "withdraw"
async function deleteRequest(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  // try {
  //   const owner = req.user as WithId<Owner>;
  //   const updateResult = await ownerCollection.updateOne(
  //     { _id: owner._id },
  //     { $pull: { requests: { _id: new ObjectId(req.params.id) } } }
  //   );
  //   res.json(updateResult);
  // } catch (err) {
  //   console.error(
  //     "The following error occured while deleting a request: " + err
  //   );
  //   next(err);
  // }
}

const ownerController = {
  getOwnerBySession,
  getPet,
  addPet,
  updatePet,
  deletePet,
  createRequest,
  editRequest,
  deleteRequest,
};

export default ownerController;
