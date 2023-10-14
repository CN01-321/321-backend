/**
 * @file Request integration tests
 * @author George Bull
 */

import { assert, expect } from "chai";
import { describe } from "mocha";
import { carerCollection } from "../../src/mongo.js";
import requestService, {
  NewRequestForm,
} from "../../src/services/requestService.js";
import { ObjectId } from "mongodb";
import { getCarer, getOwner } from "../setup.js";

describe("New Request", () => {
  it("new broad request succeeds", async () => {
    let owner = await getOwner();
    assert(owner);

    const pets = owner.pets.map((p) => p._id);
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 3);
    const endDate = new Date(Date.now() + 1000 * 60 * 60 * 7);

    const newRequestForm: NewRequestForm = {
      carer: null,
      pets: pets.map((p) => p.toString()),
      additionalInfo: "Test Request",
      dateRange: { startDate, endDate },
    };

    await requestService.newRequest(owner, newRequestForm);

    owner = await getOwner();
    assert(owner);

    const request = owner.requests.find(
      (r) => r.additionalInfo === "Test Request"
    );
    expect(request).to.exist;
    expect(request?.carer).to.be.null;
    expect(request?.additionalInfo).to.equal("Test Request");
    request?.pets.forEach(
      (petId) => expect(pets.find((p) => p.equals(petId))).to.exist
    );
  });

  it("new broad request fails", async () => {
    const owner = await getOwner();
    assert(owner);

    const pets = owner.pets.map((p) => p._id);
    const endDate = new Date(Date.now() + 1000 * 60 * 60 * 3);
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 7);

    const newRequestForm = {
      pets: pets,
      dateRange: { startDate, endDate },
    } as unknown as NewRequestForm;

    requestService.newRequest(owner, newRequestForm).should.be.rejected;
  });

  it("new direct request succeeds", async () => {
    let owner = await getOwner();
    assert(owner);

    let carer = await getCarer();
    assert(carer);

    const pets = owner.pets.map((p) => p._id);
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 3);
    const endDate = new Date(Date.now() + 1000 * 60 * 60 * 7);

    const newRequestForm: NewRequestForm = {
      carer: carer._id.toString(),
      pets: pets.map((p) => p.toString()),
      additionalInfo: "Test Request",
      dateRange: { startDate, endDate },
    };

    await requestService.newRequest(owner, newRequestForm);

    owner = await getOwner();
    assert(owner);

    const request = owner.requests.find(
      (r) => r.additionalInfo === "Test Request"
    );
    assert(request);

    expect(request?.carer).to.exist;
    expect(request?.additionalInfo).to.equal("Test Request");
    request?.pets.forEach(
      (petId) => expect(pets.find((p) => p.equals(petId))).to.exist
    );

    carer = await getCarer();
    expect(carer?.offers.find((o) => o.requestId.equals(request._id))).to.exist;
  });

  it("new direct request fails", async () => {
    const owner = await getOwner();
    assert(owner);

    const carer = await getCarer();
    assert(carer);

    const pets = owner.pets.map((p) => p._id);
    const endDate = new Date(Date.now() + 1000 * 60 * 60 * 3);
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 7);

    const newRequestForm = {
      carer: carer._id.toString(),
      pets: pets,
      dateRange: { startDate, endDate },
    } as unknown as NewRequestForm;

    requestService.newRequest(owner, newRequestForm).should.be.rejected;
  });
});

describe("Accept Respondent", () => {
  it("accept respondent succeeds", async () => {
    let owner = await getOwner();
    assert(owner, "Owner is null");

    let request = owner.requests.find((r) => r.respondents.length > 0);
    assert(request, "Request is null");

    const requestId = request._id;
    const respondentId = request.respondents[0];

    await requestService.acceptRespondent(
      owner,
      requestId.toString(),
      respondentId.toString()
    );

    owner = await getOwner();
    assert(owner, "Owner is null");

    request = owner.requests.find((r) => r._id.equals(requestId));
    assert(request, "Request is null");

    expect(request.carer?.equals(respondentId)).to.be.true;
    expect(request.status).to.equal("accepted");

    const carer = await carerCollection.findOne({ _id: respondentId });
    assert(carer, "Carer is null");

    const offer = carer.offers.find((o) => o.requestId.equals(requestId));
    assert(offer, "Offer is null");

    expect(offer.status).to.equal("accepted");
  });

  it("accept respondent fails", async () => {
    const owner = await getOwner();
    assert(owner);

    requestService.acceptRespondent(
      owner,
      new ObjectId().toString(),
      new ObjectId().toString()
    );
  });
});
