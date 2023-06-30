import { Request, Response, NextFunction } from "express";
import { WithId } from "mongodb";
import mongo from "../mongo.js";
import { Carer } from "../models/interfaces.js";

async function getCarerBySession(req: Request, res: Response, next: NextFunction) {
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