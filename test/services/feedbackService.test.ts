/**
 * @file Feedback integration tests
 * @author George Bull
 */

import { assert, expect } from "chai";
import { describe } from "mocha";
import feedbackService, {
  NewCommentForm,
  NewFeedbackForm,
} from "../../src/services/feedbackService.js";
import { getCarer, getOwner } from "../setup.js";

describe("Create Feedback", () => {
  it("create user feedback succeeds", async () => {
    const author = await getOwner();
    assert(author);

    const feedbackForm: NewFeedbackForm = {
      message: "Test Feedback",
      rating: 5,
    };

    let user = await getCarer();
    assert(user);

    await feedbackService.newUserFeedback(
      author,
      user._id.toString(),
      feedbackForm
    );

    user = await getCarer();
    assert(user);

    expect(
      user.feedback.find(
        (f) =>
          f.authorId.equals(author._id) &&
          f.authorName === author.name &&
          f.message === feedbackForm.message &&
          f.rating === feedbackForm.rating
      )
    ).to.exist;
  });

  it("create user feedback fails", async () => {
    const author = await getOwner();
    assert(author);

    const feedbackForm: NewFeedbackForm = {
      message: "Test Feedback",
      rating: -1,
    };

    const user = await getCarer();
    assert(user);

    feedbackService.newUserFeedback(author, user._id.toString(), feedbackForm)
      .should.be.rejected;
  });

  it("create pet feedback succeeds", async () => {
    const author = await getCarer();
    assert(author);

    const feedbackForm: NewFeedbackForm = {
      message: "Test Feedback",
      rating: 5,
    };

    let owner = await getOwner();
    assert(owner);
    const petId = owner.pets[0]._id;

    await feedbackService.newPetFeedback(
      author,
      petId.toString(),
      feedbackForm
    );

    owner = await getOwner();
    assert(owner);
    const pet = owner.pets.find((p) => p._id.equals(petId));
    assert(pet);

    expect(
      pet.feedback.find(
        (f) =>
          f.authorId.equals(author._id) &&
          f.authorName === author.name &&
          f.message === feedbackForm.message &&
          f.rating === feedbackForm.rating
      )
    ).to.exist;
  });

  it("create pet feedback fails", async () => {
    const author = await getCarer();
    assert(author);

    const feedbackForm: NewFeedbackForm = {
      message: "Test Feedback",
      rating: -1,
    };

    const owner = await getOwner();
    assert(owner);
    const pet = owner.pets[0];
    assert(pet);

    feedbackService.newPetFeedback(author, pet._id.toString(), feedbackForm)
      .should.be.rejected;
  });
});

describe("Create comment", () => {
  it("create user comment succeeds", async () => {
    const author = await getOwner();
    assert(author);

    let carer = await getCarer();
    assert(carer);

    const feedback = carer.feedback[0];
    assert(carer);

    const commentForm: NewCommentForm = {
      message: "Test Comment",
    };

    await feedbackService.commentOnFeedback(
      author,
      carer._id.toString(),
      feedback._id.toString(),
      commentForm
    );

    carer = await getCarer();
    assert(carer);

    expect(
      carer.feedback.find((f) =>
        f.comments.find(
          (c) =>
            c.authorId.equals(author._id) &&
            c.authorName === author.name &&
            c.message === commentForm.message
        )
      )
    ).to.exist;
  });

  it("create user comment fails", async () => {
    const author = await getOwner();
    assert(author);

    const carer = await getCarer();
    assert(carer);

    const feedback = carer.feedback[0];
    assert(carer);

    const commentForm = {} as unknown as NewCommentForm;

    feedbackService.commentOnFeedback(
      author,
      carer._id.toString(),
      feedback._id.toString(),
      commentForm
    ).should.be.rejected;
  });

  it("create pet comment succeeds", async () => {
    const author = await getCarer();
    assert(author);

    let owner = await getOwner();
    assert(owner);

    let pet = owner.pets.find((p) => p.feedback.length > 0);
    assert(pet);

    const commentForm: NewCommentForm = {
      message: "Test Comment",
    };

    await feedbackService.commentOnPetFeedback(
      author,
      pet._id.toString(),
      pet.feedback[0]._id.toString(),
      commentForm
    );

    owner = await getOwner();
    assert(owner);

    pet = owner.pets.find((p) => pet?._id.equals(p._id));
    assert(pet);

    expect(
      pet.feedback.find((f) =>
        f.comments.find(
          (c) =>
            c.authorId.equals(author._id) &&
            c.authorName === author.name &&
            c.message === commentForm.message
        )
      )
    ).to.exist;
  });

  it("create pet comment fails", async () => {
    const author = await getCarer();
    assert(author);

    const owner = await getOwner();
    assert(owner);

    const pet = owner.pets.find((p) => p.feedback.length > 0);
    assert(pet);

    const commentForm = {} as unknown as NewCommentForm;

    feedbackService.commentOnPetFeedback(
      author,
      pet._id.toString(),
      pet.feedback[0]._id.toString(),
      commentForm
    ).should.be.rejected;
  });
});

describe("Like feedback", () => {
  it("like user feedback succeeds", async () => {
    const liker = await getOwner();
    assert(liker);

    let carer = await getCarer();
    assert(carer);

    const feedback = carer.feedback[0];
    assert(feedback);

    await feedbackService.likeUserFeedback(
      liker,
      carer._id.toString(),
      feedback._id.toString()
    );

    carer = await getCarer();
    assert(carer);

    expect(
      carer.feedback
        .find((f) => f._id.equals(feedback._id))
        ?.likes.find((l) => l.equals(liker._id))
    ).to.exist;
  });

  it("like pet feedback succeeds", async () => {
    const liker = await getCarer();
    assert(liker);

    let owner = await getOwner();
    assert(owner);
    const pet = owner.pets[0];
    assert(pet);

    const feedback = pet.feedback[0];
    assert(feedback);

    await feedbackService.likePetFeedback(
      liker,
      pet._id.toString(),
      feedback._id.toString()
    );

    owner = await getOwner();
    assert(owner);

    expect(
      owner.pets
        .find((p) => p._id.equals(pet._id))
        ?.feedback.find((f) => f.likes.find((l) => l.equals(liker._id)))
    ).to.exist;
  });
});
