import Express from "express";
import { WithId } from "mongodb";
import { Carer, getCarerJobs } from "../models/carer.js";

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

  res.json(await getCarerJobs(carer, "broad"));
}

async function getDirectOffers(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;

  res.json(await getCarerJobs(carer, "direct"));
}

async function getJobs(req: Express.Request, res: Express.Response) {
  const carer = req.user as WithId<Carer>;

  res.json(await getCarerJobs(carer, "job"));
}

const carerController = {
  getCarerBySession,
  getBroadOffers,
  getDirectOffers,
  getJobs,
};

export default carerController;
