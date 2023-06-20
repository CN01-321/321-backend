import { prop } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";

class UserDetails {
    @prop()
    name?: string;

    @prop({ required: true, unique: true })
    email!: string;

    @prop({ required: true, select: false })
    password!: string;

    @prop()
    address?: string;

    @prop()
    phone?: string;

    @prop()
    bio?: string;

    @prop()
    locationLat?: number;

    @prop()
    locationLng?: number;

    @prop()
    profilePicture?: string;
}

interface UserDetails extends Base {}

export default UserDetails;