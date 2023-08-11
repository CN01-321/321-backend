import Express from "express";
import { ObjectId, WithId } from "mongodb";
import { Owner, updateOwnerDetails } from "../models/owner.js";
import ownerService from "../services/owner.js";
import requestService from "../services/request.js";

async function getOwnerBySession(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;
  res.json(owner);
}

async function updateOwner(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;

  try {
    res.json(await updateOwnerDetails(owner._id, req.body));
  } catch (err) {
    next(err);
  }
}

async function getPets(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(await ownerService.getPets(owner));
  } catch (err) {
    next(err);
  }
}

async function addPet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(await ownerService.addPet(owner, req.body));
  } catch (err) {
    next(err);
  }
}

async function updatePet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(ownerService.updatePet(owner, req.params.petId, req.body));
  } catch (err) {
    next(err);
  }
}

async function deletePet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(await ownerService.deletePet(owner, req.params.petId));
  } catch (err) {
    next(err);
  }
}

async function getRequest(req: Express.Request, res: Express.Response) {
  res.json(await requestService.getRequest(req.params.requestId));
}

async function getRequests(req: Express.Request, res: Express.Response) {
  const owner = req.user as WithId<Owner>;
  res.json(await requestService.getRequestsForOwner(owner));
}

async function createRequest(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(await requestService.newRequest(owner, req.body));
  } catch (err) {
    next(err);
  }
}

async function getRequestRespondents(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(
      await requestService.getRequestRespondents(owner, req.params.requestId)
    );
  } catch (err) {
    next(err);
  }
}

async function acceptRespondent(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(
      await requestService.acceptRespondent(
        owner,
        req.params.requestId,
        req.params.respondentId
      )
    );
  } catch (err) {
    next(err);
  }
}

async function getNearbyRequests(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const owner = req.user as WithId<Owner>;
  try {
    res.json(await requestService.getNearbyRequests(owner));
  } catch (err) {
    next(err);
  }
}

async function getPetsFromRequest(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  if (!ObjectId.isValid(req.params.requestId)) {
    res.status(400).send("Invalid requestId");
    return;
  }
  try {
    res.json(await requestService.getPetsFromRequest(req.params.requestId));
  } catch (err) {
    next(err);
  }
}

const ownerController = {
  getOwnerBySession,
  updateOwner,
  getPets,
  addPet,
  updatePet,
  deletePet,
  getRequest,
  getRequestRespondents,
  acceptRespondent,
  getRequests,
  createRequest,
  getNearbyRequests,
  getPetsFromRequest,
};

export default ownerController;
