import { ObjectId, WithId } from "mongodb";
import { BadRequestError, handleUpdateResult } from "../errors.js";
import {
  Comment,
  Feedback,
  getFeedback,
  getPetFeedback,
  likePetReview,
  likeReview,
  newComment,
  newFeedback,
  newPetComment,
  newPetFeedback,
} from "../models/feedback.js";
import { ObjectSchema, number, object, string } from "yup";
import { User } from "../models/user.js";
import notificationService from "./notificationService.js";

class FeedbackService {
  async getUserFeedback(currentUser: User, userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new BadRequestError("User id is invalid");
    }

    return await getFeedback(currentUser._id, new ObjectId(userId));
  }

  async getPetFeedback(currentUser: User, petId: string) {
    if (!ObjectId.isValid(petId)) {
      throw new BadRequestError("Pet id is invalid");
    }

    return await getPetFeedback(currentUser._id, new ObjectId(petId));
  }

  private async createFeedback(
    author: WithId<User>,
    userId: string,
    feedbackForm: NewFeedbackForm
  ): Promise<Feedback> {
    if (!ObjectId.isValid(userId)) {
      throw new BadRequestError("User id is invalid");
    }

    await validateNewFeedbackForm(feedbackForm);

    return {
      _id: new ObjectId(),
      authorId: author._id,
      authorName: author.name ?? "",
      authorIcon: author.pfp,
      postedOn: new Date(),
      likes: [],
      comments: [],
      ...feedbackForm,
    };
  }

  async newUserFeedback(
    author: WithId<User>,
    userId: string,
    feedbackForm: NewFeedbackForm
  ) {
    const feedback = await this.createFeedback(author, userId, feedbackForm);

    await notificationService.pushRecievedFeedback(
      new ObjectId(userId),
      author
    );

    handleUpdateResult(await newFeedback(feedback, new ObjectId(userId)));
  }

  async newPetFeedback(
    author: WithId<User>,
    petId: string,
    feedbackForm: NewFeedbackForm
  ) {
    const feedback = await this.createFeedback(author, petId, feedbackForm);
    handleUpdateResult(await newPetFeedback(feedback, new ObjectId(petId)));
  }

  private async createComment(
    author: WithId<User>,
    userId: string,
    feedbackId: string,
    commentForm: NewCommentForm
  ): Promise<Comment> {
    validateFeedbackPath(userId, feedbackId);

    await validateNewCommentForm(commentForm);

    return {
      authorId: author._id,
      authorName: author.name ?? "",
      authorIcon: author.pfp,
      postedOn: new Date(),
      ...commentForm,
    };
  }

  async commentOnFeedback(
    author: WithId<User>,
    userId: string,
    feedbackId: string,
    commentForm: NewCommentForm
  ) {
    const comment = await this.createComment(
      author,
      userId,
      feedbackId,
      commentForm
    );

    handleUpdateResult(
      await newComment(comment, new ObjectId(userId), new ObjectId(feedbackId))
    );
  }

  async commentOnPetFeedback(
    author: WithId<User>,
    petId: string,
    feedbackId: string,
    commentForm: NewCommentForm
  ) {
    const comment = await this.createComment(
      author,
      petId,
      feedbackId,
      commentForm
    );

    handleUpdateResult(
      await newPetComment(
        comment,
        new ObjectId(petId),
        new ObjectId(feedbackId)
      )
    );
  }

  async likeUserFeedback(
    liker: WithId<User>,
    userId: string,
    feedbackId: string
  ) {
    validateFeedbackPath(userId, feedbackId);

    handleUpdateResult(
      await likeReview(
        liker._id,
        new ObjectId(userId),
        new ObjectId(feedbackId)
      )
    );
  }

  async likePetFeedback(
    liker: WithId<User>,
    petId: string,
    feedbackId: string
  ) {
    validateFeedbackPath(petId, feedbackId);

    handleUpdateResult(
      await likePetReview(
        liker._id,
        new ObjectId(petId),
        new ObjectId(feedbackId)
      )
    );
  }
}

const feedbackService = new FeedbackService();

export default feedbackService;

export interface NewFeedbackForm {
  message: string;
  rating?: number;
}

async function validateNewFeedbackForm(form: NewFeedbackForm) {
  const schema: ObjectSchema<NewFeedbackForm> = object({
    message: string().required(),
    rating: number().min(0).max(5).optional(),
  });

  return await schema.validate(form);
}

export type NewCommentForm = Omit<NewFeedbackForm, "rating">;

async function validateNewCommentForm(form: NewCommentForm) {
  const schema: ObjectSchema<NewCommentForm> = object({
    message: string().required(),
  });

  return await schema.validate(form);
}

function validateFeedbackPath(userId: string, feedbackId: string) {
  if (!ObjectId.isValid(userId)) {
    throw new BadRequestError("User id is invalid");
  }

  if (!ObjectId.isValid(feedbackId)) {
    throw new BadRequestError("Feedback id is invalid");
  }
}
