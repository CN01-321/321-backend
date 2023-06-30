import Express from "express";
import { ObjectId, WithId } from "mongodb";
import mongo from "../mongo.js";
import { Owner, Pet, Request } from "../models/interfaces.js";

async function getOwnerBySession(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        res.json(req.user as WithId<Owner>);
    } catch (err) {
        console.error("The following error occured while getting an owner by session: " + err);
        next(err);
    }
}

async function addPet(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;

        const newPet: Pet = {
            _id: new ObjectId(),
            name: req.body.name,
            petType: req.body.petType,
            petSize: req.body.petSize,
            isVaccinated: req.body.isVaccinated,
            isFriendly: req.body.isFriendly,
            isNeutered: req.body.isNeutered,
            profilePicture: "",
            feedback: [],
        }

        const db = await mongo.database();
        const updateResult = await db.updateOne({ _id: owner._id }, { $push: { pets: newPet }});

        res.json(updateResult);
    } catch (err) {
        console.error("The following error occured while adding a pet: " + err);
        next(err);
    }
}

async function updatePet(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;

        const updatedPet: Pet = {
            _id: new ObjectId(req.params.id),
            name: req.body.name,
            petType: req.body.petType,
            petSize: req.body.petSize,
            isVaccinated: req.body.isVaccinated,
            isFriendly: req.body.isFriendly,
            isNeutered: req.body.isNeutered,
            profilePicture: "",
            feedback: [],
        }

        const db = await mongo.database();
        const updateResult = await db.updateOne({ _id: owner._id, "pets._id": updatedPet._id }, { $set : { "pets.$": updatedPet }});

        res.json(updateResult);
    } catch (err) {
        console.error("The following error occured while updating a pet: " + err);
        next(err);
    }
}

async function deletePet(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;
        const db = await mongo.database();
        const updateResult = await db.updateOne({ _id: owner._id }, { $pull : { pets: { _id: new ObjectId(req.params.id) } } });

        res.json(updateResult);
    } catch (err) {
        console.error("The following error occured while deleting a pet: " + err);
        next(err);
    }
}

async function createRequest(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;

        const newRequest: Request = {
            _id: new ObjectId(),
            requestType: req.body.requestType,
            carer: null,
            isCompleted: false,
            pets: req.body.pets,
            requestedOn: new Date(),
            dateRange: req.body.dateRange
        }

        const db = await mongo.database();
        const updateResult = await db.updateOne({ _id: owner._id }, { $push: { requests: newRequest }});

        res.json(updateResult);
    } catch (err) {
        console.error("The following error occured while creating a request: " + err);
        next(err);
    }
}

async function editRequest(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;

        let carerId;
        req.body.carer ? carerId = new ObjectId(req.body.carer) : carerId = null;

        const updatedRequest: Request = {
            _id: new ObjectId(req.params.id),
            requestType: req.body.requestType,
            carer: carerId,
            isCompleted: req.body.isCompleted,
            pets: req.body.pets,
            requestedOn: req.body.requestedOn,
            dateRange: req.body.dateRange
        }

        const db = await mongo.database();
        const updateResult = await db.updateOne({ _id: owner._id, "requests._id": updatedRequest._id }, { $set : { "requests.$": updatedRequest }});

        res.json(updateResult);
    } catch (err) {
        console.error("The following error occured while editing a request: " + err);
        next(err);
    }
}

async function deleteRequest(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        const owner = req.user as WithId<Owner>;
        const db = await mongo.database();
        const updateResult = await db.updateOne({ _id: owner._id }, { $pull : { requests: { _id: new ObjectId(req.params.id) } } });

        res.json(updateResult);
    } catch (err) {
        console.error("The following error occured while deleting a request: " + err);
        next(err);
    }
}

const ownerController = {
    getOwnerBySession,
    addPet,
    updatePet,
    deletePet,
    createRequest,
    editRequest,
    deleteRequest
}

export default ownerController;