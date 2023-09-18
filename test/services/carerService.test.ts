import { assert, expect } from "chai";
import { describe } from "mocha";
import { carerCollection, ownerCollection } from "../../src/mongo.js";
import carerService, {
  UpdateCarerForm,
} from "../../src/services/carerService.js";
import requestService from "../../src/services/requestService.js";
import { OfferType } from "../../src/models/carer.js";

async function findCarerWithPendingOffer(offerType: OfferType) {
  const carers = await carerCollection.find().toArray();
  const carer = carers.find((c) =>
    c.offers.find((o) => o.offerType === offerType && o.status === "pending")
  );
  assert(carer);

  return carer;
}

describe("Update Carer", () => {
  it("update carer succeeds", async () => {
    const before = await carerCollection.findOne({ name: "Carer 1" });
    assert(before);

    const form: UpdateCarerForm = {
      name: "Carer 1 Updated",
      location: {
        coordinates: [0, 0],
        street: "New Street",
        city: "New City",
        state: "New State",
        postcode: "0001",
      },
      phone: "0412332112",
      bio: "This is my new bio",
      preferredPetTypes: ["cat", "rabbit"],
      preferredPetSizes: ["small", "medium"],
    };

    await carerService.updateCarer(before, form);

    const after = await carerCollection.findOne({ name: "Carer 1 Updated" });
    expect(after?._id.equals(before._id)).to.be.true;
  });

  it("update carer fails", async () => {
    const before = await carerCollection.findOne({ name: "Carer 1" });
    assert(before);

    const form = {
      name: "Carer 1 Updated",
      location: {
        coordinates: [0, 0],
        street: "New Street",
        city: "New City",
        state: "New State",
        postcode: "0001",
      },
      phone: "0412332112",
      bio: "This is my new bio",
      preferredPetTypes: ["rabbit", "giraffe"],
      preferredPetSizes: ["medium", "short"],
      hourlyRate: -300,
    } as unknown as UpdateCarerForm;

    carerService.updateCarer(before, form).should.be.rejected;
  });
});

describe("Accept Offer", () => {
  it("accept broad offer succeeds", async () => {
    const beforeCarer = await findCarerWithPendingOffer("broad");

    const broadOfferId = beforeCarer.offers.find(
      (o) => o.offerType === "broad" && o.status === "pending"
    )?.requestId;
    assert(broadOfferId, "Broad offer id is null");

    await carerService.acceptOffer(
      beforeCarer,
      broadOfferId.toString(),
      "broad"
    );

    const owner = await ownerCollection.findOne({
      "requests._id": broadOfferId,
    });
    assert(owner, "Owner is null");

    const carer = await carerCollection.findOne({ _id: beforeCarer._id });
    assert(carer, "Carer is null");

    const broadOffer = carer.offers.find((o) =>
      o.requestId.equals(broadOfferId)
    );

    assert(broadOffer, "Broad offer is null");

    expect(broadOffer.status).to.equal("applied");

    // check that the carer now exists as a respondent
    const request = await requestService.getRequest(
      owner,
      broadOffer.requestId.toString()
    );

    expect(request.respondents.find((c) => c.equals(carer._id)) !== null).to.be
      .true;
  });

  it("accept broad offer fails", async () => {
    const carer = await findCarerWithPendingOffer("broad");

    carerService.acceptOffer(carer, "bad object id", "broad").should.be
      .rejected;
  });

  it("accept direct offer succeeds", async () => {
    const beforeCarer = await findCarerWithPendingOffer("direct");

    const directOffer = beforeCarer.offers.find(
      (o) => o.offerType === "direct" && o.status === "pending"
    );
    assert(directOffer);

    await carerService.acceptOffer(
      beforeCarer,
      directOffer.requestId.toString(),
      "direct"
    );

    const owner = await ownerCollection.findOne({
      "requests._id": directOffer.requestId,
    });
    assert(owner, "Owner is null");

    const carer = await carerCollection.findOne({ _id: beforeCarer._id });
    assert(carer);
    expect(
      carer.offers.find((o) => o.requestId.equals(directOffer.requestId))
        ?.status
    ).to.equal("accepted");

    // check that the carer now exists as a respondent
    const request = await requestService.getRequest(
      owner,
      directOffer.requestId.toString()
    );

    expect(request.carer?._id.equals(carer._id)).to.be.true;
  });

  it("accept direct offer fails", async () => {
    const carer = await findCarerWithPendingOffer("direct");
    assert(carer);

    carerService.acceptOffer(carer, "bad object id", "broad").should.be
      .rejected;
  });
});

describe("Reject Offer", () => {
  it("reject broad offer succeeds", async () => {
    const beforeCarer = await findCarerWithPendingOffer("broad");
    assert(beforeCarer, "Before Carer is null");

    const broadOffer = beforeCarer.offers.find(
      (o) => o.offerType === "broad" && o.status === "pending"
    );
    assert(broadOffer, "Broad offer is null");

    await carerService.rejectOffer(
      beforeCarer,
      broadOffer.requestId.toString(),
      "broad"
    );

    const carer = await carerCollection.findOne({ _id: beforeCarer._id });
    assert(carer, "Carer is null");

    expect(carer.offers.find((o) => o.requestId.equals(broadOffer.requestId)))
      .to.be.undefined;
  });

  it("reject broad offer fails", async () => {
    const carer = await findCarerWithPendingOffer("direct");
    assert(carer);

    carerService.rejectOffer(carer, "bad object id", "broad").should.be
      .rejected;
  });

  it("reject direct offer succeeds", async () => {
    const beforeCarer = await findCarerWithPendingOffer("direct");
    assert(beforeCarer, "Before Carer is null");

    const directOffer = beforeCarer.offers.find(
      (o) => o.offerType === "direct" && o.status === "pending"
    );
    assert(directOffer, "Broad offer is null");

    await carerService.rejectOffer(
      beforeCarer,
      directOffer.requestId.toString(),
      "direct"
    );

    const owner = await ownerCollection.findOne({
      "requests._id": directOffer.requestId,
    });
    assert(owner, "Owner is null");

    const carer = await carerCollection.findOne({ _id: beforeCarer._id });
    assert(carer, "Carer is null");

    expect(carer.offers.find((o) => o.requestId.equals(directOffer.requestId)))
      .to.be.undefined;

    const request = await requestService.getRequest(
      owner,
      directOffer.requestId.toString()
    );
    assert(request, "Request is null");
    expect(request.status).to.equal("rejected");
  });

  it("reject direct offer fails", async () => {
    const carer = await findCarerWithPendingOffer("direct");
    assert(carer);

    carerService.rejectOffer(carer, "bad object id", "direct").should.be
      .rejected;
  });
});
