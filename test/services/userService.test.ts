import { expect } from "chai";
import { describe } from "mocha";
import userService, { NewUserForm } from "../../src/services/userService.js";

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
