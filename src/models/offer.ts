import { prop } from "@typegoose/typegoose";
import { Types } from "mongoose";

export default class Offer {
    @prop()
    ownerId?: Types.ObjectId;

    @prop()
    carerId?: Types.ObjectId;

    @prop()
    requestedPets?: Types.ObjectId[];

    @prop()
    startDate?: Date;

    @prop()
    endDate?: Date;

    @prop()
    status?: string;
}