import Express from "express";
import { ObjectId, WithId } from "mongodb";
import { getCollection } from "../mongo.js";
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
import { Request, createNewRequest } from "../models/request.js";
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
  const pet = await getPetWithId(new ObjectId(req.params.petId));
  console.log(pet);

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
  const petId = new ObjectId(req.params.petId);

  // TODO validate petId and catch potential throw from new ObjectId()

  if (!checkOwnerPetExists(owner, petId)) {
    res.status(404).send("Pet not found for owner");
    return;
  }

  const petData = {
    _id: petId,
    name: req.body.name,
    petType: req.body.petType,
    petSize: req.body.petSize,
    isVaccinated: req.body.isVaccinated,
    isFriendly: req.body.isFriendly,
    isNeutered: req.body.isNeutered,
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

async function validateRequest(request: any): Promise<Request> {
  if (request.carer && !getCarerById(new ObjectId(request.carer))) {
    throw new Error("Carer does not exist");
  }

  if (!request.pets) {
    throw new Error("No Pets Specified");
  }

  // TODO flesh out date range validation
  if (!request.dateRange) {
    throw new Error("No date range specified");
  }

  return request as Request;
}

async function createRequest(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;

  const requestData = {
    isCompleted: false,
    pets: req.body.pets,
    requestedOn: new Date(),
    dateRange: req.body.dateRange,
  };

  try {
    const request = await validateRequest(requestData);
    res.json({ request: await createNewRequest(owner, request) });
  } catch (err) {
    console.error(
      "The following error occured while creating a request: " + err
    );
    next(err);
  }
}

async function editRequest(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    const owner = req.user as WithId<Owner>;

    let carerId;
    req.body.carer
      ? (carerId = new ObjectId(req.body.carer))
      : (carerId = null);

    const updatedRequest: Request = {
      _id: new ObjectId(req.params.id),
      carer: req.body.requestType,
      isCompleted: req.body.isCompleted,
      pets: req.body.pets,
      requestedOn: req.body.requestedOn,
      dateRange: req.body.dateRange,
    };

    const ownerCollection = await getCollection<Owner>();
    const updateResult = await ownerCollection.updateOne(
      { _id: owner._id, "requests._id": updatedRequest._id },
      { $set: { "requests.$": updatedRequest } }
    );

    res.json(updateResult);
  } catch (err) {
    console.error(
      "The following error occured while editing a request: " + err
    );
    next(err);
  }
}

async function deleteRequest(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    const owner = req.user as WithId<Owner>;
    const ownerCollection = await getCollection<Owner>();
    const updateResult = await ownerCollection.updateOne(
      { _id: owner._id },
      { $pull: { requests: { _id: new ObjectId(req.params.id) } } }
    );

    res.json(updateResult);
  } catch (err) {
    console.error(
      "The following error occured while deleting a request: " + err
    );
    next(err);
  }
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
