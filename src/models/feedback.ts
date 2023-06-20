import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import UserDetails from "./user";

class Feedback {
    @prop({ ref: () => UserDetails })
    user?: Ref<UserDetails>;

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
    @prop({ ref: () => UserDetails })
    user?: Ref<UserDetails>;

    @prop()
    text?: string

    @prop({ ref: () => Comment })
    comments?: Ref<Comment>[];
}

interface Comment extends Base {}

export { Feedback, Comment }