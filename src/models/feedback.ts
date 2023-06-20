import { Ref, prop } from "@typegoose/typegoose";
import { Types } from "mongoose";

export class Feedback {
    @prop()
    profileId?: Types.ObjectId;

    @prop()
    rating?: number;

    @prop()
    text?: string;

    @prop()
    image?: string;

    @prop({ ref: () => Comment })
    comments?: Ref<Comment>[];
}

export class Comment {
    @prop()
    profileId?: Types.ObjectId

    @prop()
    text?: string

    @prop({ ref: () => Comment })
    comments?: Ref<Comment>[];
}