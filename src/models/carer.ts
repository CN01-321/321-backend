import { Ref, prop } from "@typegoose/typegoose";
import User from "./user"
import { Feedback } from "./feedback";

export default class Carer extends User {
    @prop()
    skills?: string;
    
    @prop()
    experience?: string;

    @prop()
    preferredTravelDistance?: number;

    @prop()
    hourlyRate?: number;

    @prop({ _id: false })
    unavailabilities?: Unavailability[];

    @prop({ _id: false })
    preferredPets?: PreferredPet[];

    @prop({ _id: false })
    licences?: Licence[];

    @prop({ ref: () => Feedback })
    feedback?: Ref<Feedback>[];
}

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