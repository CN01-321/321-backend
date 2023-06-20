import { prop, Ref } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";
import UserDetails from "./user"
import { Feedback } from "./feedback";

class Carer {
    @prop({ ref: () => UserDetails})
    userDetails?: Ref<UserDetails>;

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

interface Carer extends Base {}

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

export default Carer;