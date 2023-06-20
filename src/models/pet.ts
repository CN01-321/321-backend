import { Ref, prop } from "@typegoose/typegoose"
import { Feedback } from "./feedback";
import { Types } from "mongoose";

export default class Pet {
    @prop()
    name?: string;

    @prop()
    petType?: string;

    @prop()
    petSize?: string;

    @prop()
    isVaccinated?: boolean;

    @prop()
    isFriendly?: boolean;

    @prop()
    isNeutered?: boolean;

    @prop()
    profilePicture?: string;

    @prop()
    ownerId?: Types.ObjectId;

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}