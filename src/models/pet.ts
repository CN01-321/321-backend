import { prop, Ref } from "@typegoose/typegoose"
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import Owner from "./owner";
import { Feedback } from "./feedback";

class Pet {
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

    @prop({ ref: () => Owner })
    owner?: Ref<Owner>;

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}

interface Pet extends Base {}

export default Pet;