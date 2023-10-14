/**
 * @file Global test setup and common functions
 * @author George Bull
 */

import { before } from "mocha";
import { OfferType } from "../src/models/carer.js";
import {
  carerCollection,
  ownerCollection,
  userCollection,
} from "../src/mongo.js";
import dataGenerator from "../src/services/dataGeneratorService.js";
import { User, UserLocation } from "../src/models/user.js";
import { WithId } from "mongodb";
import { Owner } from "../src/models/owner.js";

const CARER_EMAIL = "flynn.nicholson@email.com";
const OWNER_EMAIL = "kendall.thomas@email.com";

let db: User[];
before(async function () {
  this.timeout(0);
  await dataGenerator.generate();
  db = await userCollection.find().toArray();
});

beforeEach(async function () {
  this.timeout(3000);
  await userCollection.drop();
  await userCollection.insertMany(db);
  await userCollection.createIndex({ location: "2dsphere" });
  await userCollection.createIndex({ email: 1 }, { unique: true });
  await userCollection.createIndex({ "pets._id": 1 });
  await userCollection.createIndex({ "requests._id": 1 });
});

export async function getCarer() {
  return await carerCollection.findOne({ email: CARER_EMAIL });
}

export async function getOwner() {
  return (await ownerCollection.findOne({
    email: OWNER_EMAIL,
  })) as WithId<Owner> & { location: UserLocation };
}

export async function findCarerWithPendingOffer(offerType: OfferType) {
  return await carerCollection.findOne({
    "offers.offerType": offerType,
    "offers.status": "pending",
  });
}
