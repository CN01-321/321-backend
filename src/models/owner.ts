import { Ref, prop } from "@typegoose/typegoose";
import User from "./user";
import Pet from "./pet";
import { Feedback } from "./feedback";
import Offer from "./offer";

export default class Owner extends User {
    @prop({ ref: () => Pet })
    pets?: Ref<Pet>[];

    @prop({ ref: () => Offer })
    offers?: Ref<Offer>[];

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}