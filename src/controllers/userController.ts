import { Request, Response, NextFunction } from "express";
import User from "../models/user.js";
import userService from "../services/userService.js";

async function getById(req: Request, res: Response, next: NextFunction) {
    try {
        const user: User | null = await userService.getById(req.params.id);
        if (Object.is(user, User)) {
            res.json(user);
        } else {
            res.status(404).send(`User not found with given ID: ${req.params.id}`)
        }
    } catch (err) {
        console.error("The following error occured while getting a user: " + err);
        next(err);
    }
}

const userController = {
    getById,
}

export default userController;