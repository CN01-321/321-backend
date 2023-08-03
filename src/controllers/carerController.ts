import Express from "express";
import { ObjectId, WithId } from "mongodb";
import {
  Carer,
  acceptBroadOffer,
  acceptDirectOffer,
  getCarerJobs,
  getCarerOffers,
  rejectBroadOffer,
  rejectDirectOffer,
} from "../models/carer.js";

async function getCarerBySession(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    res.json(req.user);
  } catch (err) {
    console.error(
      "The following error occured while getting a carer by session: " + err
    );
    next(err);
  }
}

async function getBroadOffers(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  res.json(await getCarerOffers(carer, "broad"));
}

async function getDirectOffers(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  res.json(await getCarerOffers(carer, "direct"));
}

async function getJobs(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  res.json(await getCarerJobs(carer));
}

async function acceptOffer(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  const offerType = req.params.offerType;

  // check that the offer type is valid
  if (!(offerType === "broad" || offerType === "direct")) {
    res.status(400).send(`Unkown offer type ${offerType}`);
    return;
  }

  if (!ObjectId.isValid(req.params.offerId)) {
    res.status(400).send("Invalid offerId");
    return;
  }

  const offerId = new ObjectId(req.params.offerId);

  const accept = offerType == "broad" ? acceptBroadOffer : acceptDirectOffer;

  await accept(carer, offerId);

  // return the updated list of offers to the carer
  res.json(await getCarerOffers(carer, offerType));
}

async function rejectOffer(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;
  const offerType = req.params.offerType;

  // check that the offer type is valid
  if (!(offerType === "broad" || offerType === "direct")) {
    res.status(400).send(`Unkown offer type ${offerType}`);
    return;
  }

  if (!ObjectId.isValid(req.params.offerId)) {
    res.status(400).send("Invalid offerId");
    return;
  }

  const offerId = new ObjectId(req.params.offerId);

  const reject = offerType == "broad" ? rejectBroadOffer : rejectDirectOffer;

  await reject(carer, offerId);

  // return the updated list of offers to the carer
  res.json(await getCarerOffers(carer, offerType));
}

const carerController = {
  getCarerBySession,
  getBroadOffers,
  getDirectOffers,
  getJobs,
  acceptOffer,
  rejectOffer,
};

export default carerController;
