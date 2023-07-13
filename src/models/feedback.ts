import { ObjectId } from "mongodb";

export interface Feedback {
  authorId: ObjectId;
  rating?: number;
  text?: string;
  image?: string;
  comments: Array<Comment>;
}

export interface Comment {
  author: ObjectId;
  text?: string;
  comments: Array<Comment>;
}
