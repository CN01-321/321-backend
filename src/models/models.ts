import { getModelForClass } from "@typegoose/typegoose";
import Carer from "./carer";
import Owner from "./owner";
import Pet from "./pet";
import Offer from "./offer";
import Request from "./request";
import { Feedback, Comment } from "./feedback";

export const CarerModel = getModelForClass(Carer);
export const OwnerModel = getModelForClass(Owner);
export const PetModel = getModelForClass(Pet);
export const OfferModel = getModelForClass(Offer);
export const RequestModel = getModelForClass(Request);
export const FeedbackModel = getModelForClass(Feedback);
export const CommentModel = getModelForClass(Comment);