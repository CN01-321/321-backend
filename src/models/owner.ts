import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import User from "./user.js";
import Pet from "./pet.js";
import { Feedback } from "./feedback.js";
import Offer from "./offer.js";

class Owner extends User {
    @prop({ ref: () => Pet })
    pets?: Ref<Pet>[];

    @prop({ ref: () => Offer })
    offers?: Ref<Offer>[];

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}

interface Owner extends Base {}

export default Owner;