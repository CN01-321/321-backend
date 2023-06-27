import { Request, Response, NextFunction } from "express";
import ownerService from "../services/ownerService.js";
import Pet from "../models/pet.js";
import User from "../models/user.js";

async function addPet(req: Request, res: Response, next: NextFunction) {
    try {
        const pet = await ownerService.addPet(req.user as User, req.body.name, req.body.petType);
        if (Object.is(pet, Pet)) {
            res.json(pet);
        } else {
            res.status(400).send("Could not add pet");
        }
    } catch (err) {
        console.error("The following error occured while adding a pet: " + err);
        next(err);
    }
}

async function getPets(req: Request, res: Response, next: NextFunction) {
    try {
        const pets: Pet | Pet[] | null = await ownerService.addPet(req.user as User, req.body.name, req.body.petType);
        if (Object.is(pets, null)) {
            res.status(404).send("Could not find pets");
        } else {
            res.json(pets);
        }
    } catch (err) {
        console.error("The following error occured while adding a pet: " + err);
        next(err);
    }
}

async function deletePet(req: Request, res: Response, next: NextFunction) {
    try {
        const isDeleted = await ownerService.deletePet(req.user as User, req.params.id);
        if (isDeleted) {
            res.status(200);
        } else {
            res.status(400);
        }
    } catch (err) {
        console.error("The following error occured while deleting a pet: " + err);
        next(err);
    }
}

const ownerController = {
    addPet,
    getPets,
    deletePet,
}

export default ownerController;