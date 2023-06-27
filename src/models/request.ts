import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import Owner from "./owner.js";
import Carer from "./carer.js";
import Pet from "./pet.js";

class Request {
    @prop({ ref: () => Owner })
    ownerId?: Ref<Owner>;

    @prop({ ref: () => Carer })
    carerId?: Ref<Carer>;

    @prop({ ref: () => Pet })
    requestedPets?: Ref<Pet>[];

    @prop()
    startDate?: Date;

    @prop()
    endDate?: Date;

    @prop()
    status?: string;
}

interface Request extends Base {}

export default Request;