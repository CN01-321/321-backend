/**
 * @file Entrypoints for carer functions, passes parameters to services and handles
 * returning statuses and data back to the client
 * @author George Bull
 */

import Express from "express";
import { WithId } from "mongodb";
import { Carer } from "../models/carer.js";
import carerService from "../services/carerService.js";
import userService from "../services/userService.js";
import { UserLocation } from "../models/user.js";

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

async function getHomeOverview(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  // its safe to assert that owner has location as it will be validated through
  // the middleware before this function gets called
  const carer = req.user as WithId<Carer> & { location: UserLocation };

  try {
    res.json(await carerService.getHomeOverview(carer));
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

async function completeOffer(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  const carer = req.user as WithId<Carer>;
  try {
    res.json(await carerService.completeCarerOffer(carer, req.params.offerId));
  } catch (err) {
    next(err);
  }
}

const carerController = {
  createNewCarer,
  getCarerBySession,
  updateCarer,
  getHomeOverview,
  getBroadOffers,
  getDirectOffers,
  getJobs,
  acceptOffer,
  rejectOffer,
  completeOffer,
};

export default carerController;
