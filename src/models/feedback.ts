import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import User from "./user.js";

class Feedback {
    @prop({ ref: () => User })
    user?: Ref<User>;

    @prop()
    rating?: number;

    @prop()
    text?: string;

    @prop()
    image?: string;

    @prop({ ref: () => Comment })
    comments?: Ref<Comment>[];
}

interface Feedback extends Base {}

class Comment {
    @prop({ ref: () => User })
    user?: Ref<User>;

    @prop()
    text?: string

    @prop({ ref: () => Comment })
    comments?: Ref<Comment>[];
}

interface Comment extends Base {}

export { Feedback, Comment }