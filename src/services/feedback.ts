import { ObjectId, WithId } from "mongodb";
import { BadRequestError, handleUpdateResult } from "../errors";
import {
  Comment,
  Feedback,
  getFeedback,
  getPetFeedback,
  likeReview,
  newComment,
  newFeedback,
  newPetFeedback,
} from "../models/feedback";
import { ObjectSchema, number, object, string } from "yup";
import { User } from "../models/user";

class FeedbackService {
  async getUserFeedback(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw new BadRequestError("User id is invalid");
    }

    return await getFeedback(new ObjectId(userId));
  }

  async getPetFeedback(petId: string) {
    if (!ObjectId.isValid(petId)) {
      throw new BadRequestError("Pet id is invalid");
    }

    return await getPetFeedback(new ObjectId(petId));
  }

  async createFeedback(
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

  async createComment(
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
      await newComment(comment, new ObjectId(petId), new ObjectId(feedbackId))
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
      await likeReview(liker._id, new ObjectId(petId), new ObjectId(feedbackId))
    );
  }
}

const feedbackService = new FeedbackService();

export default feedbackService;

interface NewFeedbackForm {
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

type NewCommentForm = Omit<NewFeedbackForm, "rating">;

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
