import Express from "express";
import { ObjectId } from "mongodb";
import { getPetWithId } from "../models/pet";

async function getPet(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  if (!ObjectId.isValid(req.params.petId)) {
    res.status(400).send("Invalid petId");
    return;
  }

  const pet = await getPetWithId(new ObjectId(req.params.petId));
  console.log(req.params.id, pet);

  res.json(pet);
}

const petController = {
  getPet,
};

export default petController;
