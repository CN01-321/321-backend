import { ObjectId } from "mongodb";
import { ownerCollection } from "../src/mongo.js";
import dataGenerator from "../src/services/dataGeneratorService.js";
import ownerService, {
  AddPetForm,
  OwnerUpdateForm,
  UpdatePetForm,
} from "../src/services/ownerService.js";
import chai, { expect } from "chai";
import { beforeEach, describe } from "mocha";
import chaiAsPromised from "chai-as-promised";
import { Owner } from "../src/models/owner.js";
import { NotFoundError } from "../src/errors.js";

chai.use(chaiAsPromised);
chai.should();

let owner: Owner;

before(async () => {
  await dataGenerator.generate();
  const res = await ownerCollection.findOne({ name: "Owner 1" });
  if (!res) throw new NotFoundError("owner not found");
  owner = res;
});

beforeEach(async () => {
  // wait until data has finished generating
  while (!owner) continue;
  await ownerCollection.updateOne({ _id: owner._id }, { $set: owner });
});

describe("Update Owner", () => {
  it("updating owner successful", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    if (!before) {
      expect(before).to.be.true;
      return;
    }

    const form: OwnerUpdateForm = {
      name: "Owner 1 Updated",
      location: {
        coordinates: [0, 0],
        street: "New Street",
        city: "New City",
        state: "New State",
        postcode: "0001",
      },
      phone: "0412332112",
      bio: "This is my new bio",
    };

    await ownerService.updateOwner(before, form);

    const after = await ownerCollection.findOne({ name: "Owner 1 Updated" });
    expect(after?._id.toString()).to.equal(before._id.toString());
  });

  it("update owner fails", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    if (!before) {
      expect(before).to.be.true;
      return;
    }

    const form = {
      name: "Owner 1 Updated",
      location: {
        coordinates: [0, 0, 0],
        postcode: "0001",
      },
      phone: 0,
    } as unknown as OwnerUpdateForm;

    ownerService.updateOwner(before, form).should.be.rejected;
  });
});

describe("Add Pet", async () => {
  it("add pet succeeds", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    if (!before) {
      expect(before).to.be.true;
      return;
    }

    const form: AddPetForm = {
      name: "Test Pet",
      petType: "dog",
      petSize: "small",
      isVaccinated: false,
      isFriendly: false,
      isNeutered: false,
    };

    await ownerService.addPet(before, form);

    const after = await ownerCollection.findOne({ name: "Owner 1" });
    const pet = after?.pets.find((p) => p.name === "Test Pet");

    expect(pet?.name === "Test Pet").to.be.true;
  });

  it("add pet fails", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    if (!before) {
      expect(before).to.be.true;
      return;
    }

    const form = {
      name: "Test Pet",
      petType: "lizard",
      petSize: "short",
    } as unknown as AddPetForm;

    ownerService.addPet(before, form).should.be.rejected;
  });
});

describe("Update Pet", async () => {
  it("update pet succeeds", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    const pet = before?.pets[0];
    if (!before || !pet) {
      expect(before).to.be.true;
      expect(pet).to.be.true;
      return;
    }

    const form: UpdatePetForm = {
      name: "Test Pet",
      petType: "cat",
      petSize: "large",
      isVaccinated: true,
      isFriendly: true,
      isNeutered: true,
    };

    const petId = pet._id.toString();
    await ownerService.updatePet(before, petId, form);

    const after = await ownerCollection.findOne({ name: "Owner 1" });
    const updatedPet = after?.pets.find((p) => p._id.equals(pet._id));

    expect(updatedPet?.name).to.equal("Test Pet");
  });

  it("update pet fails", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    const pet = before?.pets[0];
    if (!before || !pet) {
      expect(before).to.be.true;
      expect(pet).to.be.true;
      return;
    }

    const form: UpdatePetForm = {
      name: "Test Pet",
      petType: "tiger",
      petSize: "larger",
      isVaccinated: "no",
    } as unknown as UpdatePetForm;

    const petId = pet._id.toString();

    ownerService.updatePet(before, petId, form).should.be.rejected;
  });
});

describe("Delete Pet", async () => {
  it("delete pet succeeds", async () => {
    const before = await ownerCollection.findOne({ name: "Owner 1" });
    const pet = before?.pets[0];
    if (!before || !pet) {
      expect(before).to.be.true;
      expect(pet).to.be.true;
      return;
    }

    const petId = pet._id.toString();
    await ownerService.deletePet(before, petId);

    const after = await ownerCollection.findOne({ name: "Owner 1" });
    const deletedPet = after?.pets.find((p) => p._id === pet._id);

    expect(deletedPet).to.be.undefined;
  });

  it("delete pet fails", async () => {
    const owner = await ownerCollection.findOne({ name: "Owner 1" });
    if (!owner) {
      expect(owner).to.be.true;
      return;
    }

    ownerService.deletePet(owner, new ObjectId().toString()).should.be.rejected;
  });
});
