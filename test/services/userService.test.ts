/**
 * @file User integration tests
 * @author George Bull
 */

import { assert, expect } from "chai";
import { describe } from "mocha";
import userService, { NewUserForm } from "../../src/services/userService.js";
import { userCollection } from "../../src/mongo.js";
import { ImageMetadata } from "../../src/services/imageStorageService.js";

describe("New User", () => {
  it("new user succeeds", async () => {
    const newUserForm: NewUserForm = {
      email: "email@email.com",
      password: "S3cur3_Password",
    };

    await userService.newUser(newUserForm, "owner");

    const owner = userService.getUserByEmail(newUserForm.email);
    expect(owner).to.exist;
  });

  it("new user fails", async () => {
    const newUserForm: NewUserForm = {
      email: "invalid email",
      password: "insecpw",
    };

    userService.newUser(newUserForm, "owner").should.be.rejected;
  });
});

describe("Set Pfp", () => {
  it("set pfp succeeds", async () => {
    let user = await userCollection.findOne({
      pfp: { $exists: false },
    });
    assert(user);

    const metadata: ImageMetadata = { imageType: "image/png" };
    const image = Buffer.from("some image");

    await userService.setPfp(user, metadata, image);

    user = await userCollection.findOne({ _id: user._id });
    assert(user);

    expect(user.pfp).to.exist;
  });
});
