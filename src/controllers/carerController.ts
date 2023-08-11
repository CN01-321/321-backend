import Express from "express";
import { WithId } from "mongodb";
import { Carer } from "../models/carer.js";
import carerService from "../services/carer.js";
import userService from "../services/user.js";

async function createNewCarer(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    await userService.newUser(req.body, "carer");
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}
async function getCarerBySession(req: Express.Request, res: Express.Response) {
  res.json(req.user);
}

async function updateCarer(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const carer = req.user as WithId<Carer>;
  try {
    res.json(await carerService.updateCarer(carer, req.body));
  } catch (err) {
    next(err);
  }
}

async function getBroadOffers(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  res.json(await carerService.getBroadOffers(carer));
}

async function getDirectOffers(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  res.json(await carerService.getDirectOffers(carer));
}

async function getJobs(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  res.json(await carerService.getJobs(carer));
}

async function acceptOffer(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const carer = req.user as WithId<Carer>;
  try {
    res.json(
      await carerService.acceptOffer(
        carer,
        req.params.offerId,
        req.params.offerType
      )
    );
  } catch (err) {
    next(err);
  }
}

async function rejectOffer(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const carer = req.user as WithId<Carer>;
  try {
    res.json(
      await carerService.rejectOffer(
        carer,
        req.params.offerId,
        req.params.offerType
      )
    );
  } catch (err) {
    next(err);
  }
}

const carerController = {
  createNewCarer,
  getCarerBySession,
  updateCarer,
  getBroadOffers,
  getDirectOffers,
  getJobs,
  acceptOffer,
  rejectOffer,
};

export default carerController;
