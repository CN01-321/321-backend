import { modelOptions, prop } from "@typegoose/typegoose";
import { Base } from "@typegoose/typegoose/lib/defaultClasses";

export enum UserType {
    OWNER = "owner",
    CARER = "carer"
}

@modelOptions({schemaOptions: {discriminatorKey: "userType"}})
class User {
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

    @prop({required: true})
    userType!: string;
}

interface User extends Base {}

export default User;