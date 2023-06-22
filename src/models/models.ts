import { getDiscriminatorModelForClass, getModelForClass } from "@typegoose/typegoose";
import User, { UserType } from "./user.js";
import Carer from "./carer.js";
import Owner from "./owner.js";
import Pet from "./pet.js";
import Offer from "./offer.js";
import Request from "./request.js";
import { Feedback, Comment } from "./feedback.js";

export const UserModel = getModelForClass(User)
export const CarerModel = getDiscriminatorModelForClass(UserModel, Carer, UserType.CARER);
export const OwnerModel = getDiscriminatorModelForClass(UserModel, Owner, UserType.OWNER);
export const PetModel = getModelForClass(Pet);
export const OfferModel = getModelForClass(Offer);
export const RequestModel = getModelForClass(Request);
export const FeedbackModel = getModelForClass(Feedback);
export const CommentModel = getModelForClass(Comment);