import { Schema, model } from "mongoose";

export interface IUser {
    email: string,
    password: string,
    userType: UserType,
}

export type UserType = 'owner' | 'carer';

const userSchema = new Schema<IUser>({
    email: { type: String, required: true },
    password: { type: String, required: true },
    userType: {type: String, required: true },
})

export const User = model<IUser>('User', userSchema)