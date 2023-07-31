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
  updateCarerDetails,
} from "../models/carer.js";
import { handleControllerError } from "../util.js";

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

async function updateCarer(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const carer = req.user as WithId<Carer>;
    await updateCarerDetails(carer._id, req.body);
  } catch (err) {
    handleControllerError(res, err, 400)
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

  res.json(await accept(carer, offerId));
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

  res.json(await reject(carer, offerId));
}

const carerController = {
  getCarerBySession,
  updateCarer,
  getBroadOffers,
  getDirectOffers,
  getJobs,
  acceptOffer,
  rejectOffer,
};

export default carerController;
