import { Request, Response, NextFunction } from "express";
import { ObjectId, WithId } from "mongodb";
import mongo from "../mongo.js";
import { Owner, Pet } from "../models/interfaces.js";

async function getOwnerBySession(req: Request, res: Response, next: NextFunction) {
    try {
        res.json(req.user as WithId<Owner>);
    } catch (err) {
        console.error("The following error occured while getting an owner by session: " + err);
        next(err);
    }
}

async function addPet(req: Request, res: Response, next: NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;

        const newPet: Pet = {
            _id: new ObjectId(),
            name: req.body.pet.name,
            petType: req.body.pet.petType,
            petSize: req.body.pet.petSize,
            isVaccinated: req.body.pet.isVaccinated,
            isFriendly: req.body.pet.isFriendly,
            isNeutered: req.body.pet.isNeutered,
            profilePicture: "",
            feedback: [],
        }

        const db = await mongo.database();
        const updatedOwner = await db.updateOne({ _id: owner._id }, { $push: { pets: newPet }});

        res.json(updatedOwner);
    } catch (err) {
        console.error("The following error occured while adding a pet: " + err);
        next(err);
    }
}

async function updatePet(req: Request, res: Response, next: Function) {
    try {
        const owner = req.user as WithId<Owner>;

        const updatedPet: Pet = {
            _id: new ObjectId(req.params.id),
            name: req.body.pet.name,
            petType: req.body.pet.petType,
            petSize: req.body.pet.petSize,
            isVaccinated: req.body.pet.isVaccinated,
            isFriendly: req.body.pet.isFriendly,
            isNeutered: req.body.pet.isNeutered,
            profilePicture: "",
            feedback: [],
        }

        const db = await mongo.database();
        const updatedOwner = await db.updateOne({ _id: owner._id, "pets._id": updatedPet._id }, { $set : { "pets.$": updatedPet }});

        res.json(updatedOwner);
    } catch (err) {
        console.error("The following error occured while updating a pet: " + err);
        next(err);
    }
}

async function deletePet(req: Request, res: Response, next: NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;
        const db = await mongo.database();
        const modifiedOwner = await db.updateOne({ _id: owner._id }, { $pull : { pets: { _id: new ObjectId(req.params.id) } } });

        res.json(modifiedOwner);
    } catch (err) {
        console.error("The following error occured while deleting a pet: " + err);
        next(err);
    }
}

const ownerController = {
    getOwnerBySession,
    addPet,
    updatePet,
    deletePet,
}

export default ownerController;