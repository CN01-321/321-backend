import { prop } from "@typegoose/typegoose";

export default class User {
    @prop()
    name?: string;

    @prop()
    email?: string;

    @prop()
    password?: string;

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