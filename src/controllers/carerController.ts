import Express from "express";
import { WithId } from "mongodb";
import mongo from "../mongo.js";
import { Carer } from "../models/interfaces.js";

async function getCarerBySession(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    try {
        res.json(req.user);
    } catch (err) {
        console.error("The following error occured while getting a carer by session: " + err);
        next(err);
    }
}

const carerController = {
    getCarerBySession,
}

export default carerController;