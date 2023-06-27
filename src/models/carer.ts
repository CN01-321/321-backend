import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import User from "./user.js"
import { Feedback } from "./feedback.js";

class Unavailability {
    @prop()
    startDate?: Date;

    @prop()
    endDate?: Date;
}

class PreferredPet {
    @prop()
    petType?: string;

    @prop()
    petSize?: string;
}

class Licence {
    @prop()
    licenceName?: string;

    @prop()
    licenceNumber?: string;
}

class Carer extends User {
    @prop()
    skills?: string;
    
    @prop()
    experience?: string;

    @prop()
    preferredTravelDistance?: number;

    @prop()
    hourlyRate?: number;

    @prop({ _id: false, type: Unavailability })
    unavailabilities?: Unavailability[];

    @prop({ _id: false, type: PreferredPet})
    preferredPets?: PreferredPet[];

    @prop({ _id: false, type: Licence })
    licences?: Licence[];

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}

interface Carer extends Base {}


export default Carer;