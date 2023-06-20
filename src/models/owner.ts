import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import UserDetails from "./user";
import Pet from "./pet";
import { Feedback } from "./feedback";
import Offer from "./offer";

class Owner {
    @prop({ ref: () => UserDetails})
    userDetails?: Ref<UserDetails>;
    
    @prop({ ref: () => Pet })
    pets?: Ref<Pet>[];

    @prop({ ref: () => Offer })
    offers?: Ref<Offer>[];

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}

interface Owner extends Base {}

export default Owner;