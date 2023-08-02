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
  getOwnerPets,
  PetType,
  PetSize,
} from "../models/pet.js";
import {
  Request,
  SearchQuery,
  acceptRequestRespondent,
  createNewRequest,
  getOwnerRequests,
  getRequestPets,
  getRequestWithId,
  getRespondents,
  searchForNearby,
  updateRequest,
} from "../models/request.js";
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

async function getPets(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;
  res.json(await getOwnerPets(owner));
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
  if (
    dateRange.startDate === undefined ||
    new Date(dateRange.startDate) < new Date(Date.now() - 60 * 60 * 5)
  ) {
    throw new Error("Start date is invalid");
  }

  if (
    dateRange.endDate === undefined ||
    new Date(dateRange.endDate) < new Date(dateRange.startDate)
  ) {
    throw new Error("End date is invalid");
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

  if (!request.pets.every(ObjectId.isValid)) {
    throw new Error("Pet Id is invalid");
  }

  request.pets = request.pets.map((id: string) => new ObjectId(id));

  validateDateRange(request.dateRange);
  request.dateRange = {
    startDate: new Date(request.dateRange.startDate),
    endDate: new Date(request.dateRange.startDate),
  };

  return request as Request;
}

async function getRequest(req: Express.Request, res: Express.Response) {
  res.json(await getRequestWithId(new ObjectId(req.params.requestId)));
}

async function getRequests(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;
  res.json(await getOwnerRequests(owner));
}

async function createRequest(req: Express.Request, res: Express.Response) {
  console.log("new request is: ", req.body);

  const owner = req.user as WithId<Owner>;
  const requestData = {
    carer: req.body.carer ?? null,
    status: "pending",
    requestedOn: new Date(),
    pets: req.body.pets,
    additionalInfo: req.body.message,
    dateRange: req.body.dateRange,
    respondents: [],
  };

  console.log(owner, req.body, requestData);

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

async function getRequestRespondents(
  req: Express.Request,
  res: Express.Response
) {
  if (!ObjectId.isValid(req.params.requestId)) {
    res.status(400).send("Invalid request id");
    return;
  }

  const owner = req.user as WithId<Owner>;

  res.json(await getRespondents(owner, new ObjectId(req.params.requestId)));
}

async function acceptRespondent(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;

  if (!ObjectId.isValid(req.params.requestId)) {
    res.status(400).send("Invalid request id");
    return;
  }

  const requestId = new ObjectId(req.params.requestId);

  if (!ObjectId.isValid(req.params.respondentId)) {
    res.status(400).send("Invalid respondent id");
    return;
  }

  const respondentId = new ObjectId(req.params.respondentId);

  // check that the respondentId is in the request's respondents array,
  // we can get this from the owner which has been recently fetched from the db
  if (
    !owner.requests
      .find((r) => requestId.equals(r._id!))
      ?.respondents.find((r) => respondentId.equals(r))
  ) {
    res.status(404).send(`Could not find respondent with id ${respondentId}`);
    return;
  }

  res.json(await acceptRequestRespondent(owner, requestId, respondentId));
}

function validateQuery(query: any): SearchQuery {
  const searchQuery: SearchQuery = {};

  // validate price is a positive number if exists and add to seach query if exists
  if (query.price) {
    const price = Number(query.price);
    if (Number.isNaN(price) || query.price < 0) {
      throw new Error("Price must be a positive number");
    }

    searchQuery.price = price;
  }

  // validate petTypes is an array of petTypes and add it to query if exists
  if (query.petTypes) {
    // verify petTypes is an array and that each type is a valid pet type
    if (
      !Array.isArray(query.petTypes) ||
      !query.petTypes.every((t: PetType) => petTypes.includes(t))
    ) {
      throw new Error("PetTypes must be an array of PetTypes");
    }

    searchQuery.petTypes = query.petTypes;
  }

  // validate petSizes the same way as petTypes
  if (query.petSizes) {
    if (
      !Array.isArray(query.petSizes) ||
      !query.petSizes.every((s: PetSize) => petSizes.includes(s))
    ) {
      throw new Error("PetSizes must be an array of PetSizes");
    }

    searchQuery.petSizes = query.petSizes;
  }

  return searchQuery;
}

// query searches can include arrays by using the ?a[]=1&a[]=2 syntax
// see https://www.npmjs.com/package/qs # Parsing arrays
async function searchRequests(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;

  console.log(req.query);

  try {
    // get search query params
    const query = validateQuery(req.query);

    res.json(await searchForNearby(owner, query));
  } catch (e) {
    handleControllerError(res, e, 400);
  }
}

async function getPetsFromRequest(req: Express.Request, res: Express.Response) {
  if (!ObjectId.isValid(req.params.requestId)) {
    res.status(400).send("Invalid requestId");
    return;
  }
  try {
    res.json(await getRequestPets(new ObjectId(req.params.requestId)));
  } catch (e) {
    handleControllerError(res, e, 400);
  }
}

const ownerController = {
  getOwnerBySession,
  getPet,
  getPets,
  addPet,
  updatePet,
  deletePet,
  getRequest,
  getRequestRespondents,
  acceptRespondent,
  getRequests,
  createRequest,
  editRequest,
  searchRequests,
  getPetsFromRequest,
};

export default ownerController;
