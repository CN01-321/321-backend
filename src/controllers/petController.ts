import Express from "express";
import petService from "../services/pet.js";

async function getPet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  try {
    res.json(await petService.getPet(req.params.petId));
  } catch (err) {
    next(err);
  }
}

const petController = {
  getPet,
};

export default petController;
