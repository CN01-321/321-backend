/**
 * @file Logic for generating random data for database seeding on startup
 * @author George Bull
 */

import fs from "fs";
import prand from "pure-rand";
import { carerCollection, ownerCollection, userCollection } from "../mongo.js";
import { Pet, PetType, petSizes, petTypes } from "../models/pet.js";
import { Carer } from "../models/carer.js";
import { MongoError, ObjectId } from "mongodb";
import { Owner } from "../models/owner.js";
import { User, UserLocation } from "../models/user.js";
import { Feedback } from "../models/feedback.js";
import ownerService, { AddPetForm } from "./ownerService.js";
import requestService from "./requestService.js";
import feedbackService from "./feedbackService.js";
import carerService from "./carerService.js";
import imageStorageService, { ImageMetadata } from "./imageStorageService.js";
import userService from "./userService.js";

import Profiles from "../../assets/datagen/Profiles.json" assert { type: "json" };
import Reviews from "../../assets/datagen/Reviews.json" assert { type: "json" };

const DEFAULT_SEED = 1;
let rng = prand.mersenne(DEFAULT_SEED);

/**
 * Generate a random number within a min and max (inclusive) range
 */
function randNum(min: number, max: number): number {
  const [num, next_rng] = prand.uniformIntDistribution(min, max, rng);
  rng = next_rng;
  return num;
}

function randBool(): boolean {
  return randNum(0, 1) == 0;
}

/**
 * Creates a random boolean with the chance of true being 1 out of (chance + 1)
 */
function randChance(chance: number): boolean {
  return randNum(0, chance) === 0;
}

/**
 * Generates a random ObjectId based on the prand seed. This allows the app to
 * continue to function over database resets if logged in as a user generated
 * by the data generator.
 */
function createObjectId(): ObjectId {
  let hexStr = "";

  // generate at 24 long hex string
  while (hexStr.length < 24) {
    // genrerate anywhere from '0' - 'f'
    const asciiCode = randNum(48, 102);
    // skip if not [0-9a-f]
    if (asciiCode > 57 && asciiCode < 97) continue;
    hexStr += String.fromCharCode(asciiCode);
  }

  return new ObjectId(hexStr);
}

function randFirstName() {
  return Profiles.fnames[randNum(0, Profiles.fnames.length - 1)];
}

function randLastName() {
  return Profiles.lnames[randNum(0, Profiles.fnames.length - 1)];
}

function randPetName() {
  return Profiles.petNames[randNum(0, Profiles.petNames.length - 1)];
}

function genEmail(first: string, last: string) {
  return `${first.toLowerCase()}.${last.toLowerCase()}@email.com`;
}

function randPhoneNumber() {
  let phone = "04";
  while (phone.length < 10) phone += randNum(0, 9);
  return phone;
}

function randOwnerBio() {
  return Profiles.ownerBio[randNum(0, Profiles.ownerBio.length - 1)];
}

function randCarerBio() {
  return Profiles.carerBio[randNum(0, Profiles.carerBio.length - 1)];
}

function randAddress() {
  return Profiles.addresses[randNum(0, Profiles.addresses.length - 1)];
}

function randPerferredTravelDistance() {
  return randNum(3, 10) * 10000;
}

function randHourlyRate() {
  return randNum(25, 150);
}

function randOwnerReview() {
  return Reviews.ownerReviews[randNum(0, Reviews.ownerReviews.length - 1)];
}

function randCarerReview() {
  return Reviews.carerReviews[randNum(0, Reviews.carerReviews.length - 1)];
}

function randPetReview() {
  return Reviews.petReviews[randNum(0, Reviews.petReviews.length - 1)];
}

function randComment() {
  return Reviews.comments[randNum(0, Reviews.comments.length - 1)];
}

function randPetType() {
  return petTypes[randNum(0, petTypes.length - 1)];
}

function randPetSize() {
  return petSizes[randNum(0, petSizes.length - 1)];
}

class DataGeneratorService {
  private pfps: string[] = [];
  private petPfps: Map<PetType, string[]> = new Map();

  /**
   * Prints out the emails of the current owners and carers
   */
  async showLogins() {
    const owners = await carerCollection.find({ userType: "owner" }).toArray();
    const ownerEmails = owners
      .map((o) => o.email)
      .reduce((emails, email) => `${emails}\n${email}`);
    console.log(`=== Owner emails ===\n${ownerEmails}`);

    console.log();

    const carers = await carerCollection.find({ userType: "carer" }).toArray();
    const carerEmails = carers
      .map((c) => c.email)
      .reduce((emails, email) => `${emails}\n${email}`);
    console.log(`=== Carer emails ===\n${carerEmails}`);
  }

  async generate() {
    if (process.env.POPULATE_IMAGES === "true") {
      await this.generateImages();
      console.log("uploaded images");
    }

    this.pfps = await this.getPfpIds();
    this.petPfps = await this.getPetPfpIds();

    // drops everything
    try {
      await userCollection.deleteMany({});
    } catch (err) {
      console.error(err);
    }

    console.log("dropped everything");

    await this.genCarers();
    console.log("generated owners");

    await this.genOwners();
    console.log("generated carers");

    let carers = await carerCollection.find({ userType: "carer" }).toArray();
    let owners = await ownerCollection.find({ userType: "owner" }).toArray();

    await this.genBroadRequests(owners);
    console.log("generated broad requests");

    await this.genDirectRequests(owners, carers);
    console.log("generated direct requests");

    await this.genFeedback(carers, owners);
    console.log("generated feedback requests");

    carers = await carerCollection.find({ userType: "carer" }).toArray();
    await this.acceptOffers(carers);
    console.log("accepted offers");

    carers = await carerCollection.find({ userType: "carer" }).toArray();
    owners = await ownerCollection.find({ userType: "owner" }).toArray();

    await this.acceptCarers(owners);
    console.log("accepted carers");

    carers = await carerCollection.find({ userType: "carer" }).toArray();

    await this.completeJobs(carers);
    console.log("completed jobs");

    carers = await carerCollection.find({ userType: "carer" }).toArray();
    owners = await ownerCollection.find({ userType: "owner" }).toArray();

    await this.genCommentsAndLikes(carers, owners);
    console.log("added comments and likes ");

    console.log("---- populated users ----");
  }

  async generateImages() {
    // deleteAll will throw if no gridfs bucket exists yet, it is fine to
    // continue as the bucket will be created when the images are inserted.
    try {
      await imageStorageService.deleteAll();
    } catch (err) {
      console.error(err);
    }

    const pfpDir = fs.readdirSync("assets/images/pfp");
    for (const pfp of pfpDir) {
      await this.storePfp(pfp);
    }

    for (const petType of petTypes) {
      const petPfpDir = fs.readdirSync(`assets/images/pet/${petType}s`);
      for (const pfp of petPfpDir) {
        await this.storePetPfp(pfp, petType);
      }
    }
  }

  async getPfpIds() {
    return await imageStorageService.getImageIds({ pfp: "profile" });
  }

  /**
   * Fetches the image ids of each PetType and creates a map of id arrays
   * indexed by the PetType
   */
  async getPetPfpIds() {
    const petTypePfpIds: [PetType, string[]][] = [];
    for (const petType of petTypes) {
      petTypePfpIds.push([
        petType,
        await imageStorageService.getImageIds({ petType }),
      ]);
    }

    return new Map(petTypePfpIds);
  }

  /**
   * Uploads the pfp image from the filesystem and stores it in GridFs
   */
  async storePfp(pfp: string) {
    const metadata: ImageMetadata = {
      imageType: "image/png",
      pfp: "profile",
    };

    const buffer = fs.readFileSync("assets/images/pfp/" + pfp);

    await imageStorageService.storeImage(metadata, buffer, pfp);
  }

  /**
   * Uploads the pet pfp image from the filesystem and stores it in GridFs
   */
  async storePetPfp(pfp: string, petType: PetType) {
    const metadata: ImageMetadata = { imageType: "image/jpeg", petType };

    const buffer = fs.readFileSync(`assets/images/pet/${petType}s/${pfp}`);

    await imageStorageService.storeImage(metadata, buffer, pfp);
  }

  getRandPfp() {
    return this.pfps[randNum(0, this.pfps.length - 1)];
  }

  getRandPetPfp(petType: PetType) {
    const petPfps = this.petPfps.get(petType) ?? [];
    return petPfps[randNum(0, petPfps.length - 1)];
  }

  private async genCarers() {
    // return either a random selection of pet types or all pet types
    // (no carer should prefer nothing)
    const genPreferredPetTypes = () => {
      const genPetTypes = petTypes.filter(() => randChance(2));
      return genPetTypes.length === 0 ? petTypes : genPetTypes;
    };

    const genPreferredPetSizes = () => {
      const genPetSizes = petSizes.filter(() => randChance(2));
      return genPetSizes.length === 0 ? petSizes : genPetSizes;
    };

    let carerCount = 0;
    while (carerCount < 20) {
      const fname = randFirstName();
      const lname = randLastName();

      const carer: Carer = {
        _id: createObjectId(),
        email: genEmail(fname, lname),
        passwordHash: await userService.hashPasword("password"),
        name: `${fname} ${lname}`,
        userType: "carer",
        phone: randPhoneNumber(),
        bio: randCarerBio(),
        location: this.genLocation(),
        notifications: [],
        feedback: [],
        preferredTravelDistance: randPerferredTravelDistance(),
        hourlyRate: randHourlyRate(),
        offers: [],
        preferredPetTypes: genPreferredPetTypes(),
        preferredPetSizes: genPreferredPetSizes(),
        // set pfp or have chance that no pfp has been set
      };

      // give a big chance of assigning a pfp to the carer, otherwise have a
      // small chance of the carer having the default pfp
      if (!randChance(6)) {
        carer.pfp = this.getRandPfp();
      }

      try {
        await carerCollection.insertOne(carer);
        carerCount++;
      } catch (err) {
        // if key duplication occurs it means that the name has be generated
        // before and then try again otherwise rethrow the error as it is unknown
        if (err instanceof MongoError && err.code === 11000) {
          continue;
        }

        throw err;
      }
    }
  }

  private async genOwners() {
    let ownerCount = 0;
    while (ownerCount < 20) {
      const fname = randFirstName();
      const lname = randLastName();

      const owner: Owner = {
        _id: createObjectId(),
        email: genEmail(fname, lname),
        passwordHash: await userService.hashPasword("password"),
        name: `${fname} ${lname}`,
        phone: randPhoneNumber(),
        bio: randOwnerBio(),
        userType: "owner",
        location: this.genLocation(),
        notifications: [],
        feedback: [],
        pets: [],
        requests: [],
      };

      // give a big chance of assigning a pfp to the owner, otherwise have a
      // small chance of the owner having the default pfp
      if (!randChance(6)) {
        owner.pfp = this.getRandPfp();
      }

      try {
        await ownerCollection.insertOne(owner);
        await this.genPets(owner);
        ownerCount++;
      } catch (err) {
        // if key duplication error then try again otherwise rethrow
        if (err instanceof MongoError && err.code === 11000) {
          continue;
        }

        throw err;
      }
    }
  }

  /**
   * Generates a location around the wollongong or sydney area
   */
  private genLocation(): UserLocation {
    const sydneyCoords = { lat: -33.8688, lng: 151.2093 };
    const wollongongCoords = { lat: -34.4248, lng: 150.8931 };

    const coords = randBool() ? sydneyCoords : wollongongCoords;

    // 0.5 lat/lng is very roughly 50km, so randomly generate coorsds+/- 50km
    // to the coordinates chosen
    const latOffset = randNum(-500, 500) / 1000;
    const lngOffset = randNum(-500, 500) / 1000;

    coords.lat += latOffset;
    coords.lng += lngOffset;

    const address = randAddress();

    return {
      type: "Point",
      coordinates: [coords.lng, coords.lat],
      ...address,
    };
  }

  /**
   * Generates 1-5 pets for the given owner
   */
  private async genPets(owner: Owner) {
    const newPet: () => AddPetForm = () => {
      const petType = randPetType();
      return {
        name: randPetName(),
        petType,
        petSize: randPetSize(),
        isVaccinated: randBool(),
        isFriendly: randBool(),
        isNeutered: randBool(),
        pfp: this.getRandPetPfp(petType),
      };
    };

    const numPets = randNum(1, 5);
    for (let i = 1; i <= numPets; i++) {
      await ownerService.addPet(owner, newPet());
    }
  }

  /**
   * Generates a date range starting 1 - 7 days in the future and ending
   * 1-8 hours after the start date
   */
  private genRandomDateRange() {
    const startDate = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * randNum(1, 7)
    );
    // endDate is 1-8 hours in the future of startDate
    const endDate = new Date(
      startDate.getTime() + 1000 * 60 * 60 * randNum(1, 8)
    );

    return { startDate, endDate };
  }

  /**
   * Generates random request pets ensuring that at lease one pet has been added
   */
  private genRandomPetsForRequests(pets: Pet[]) {
    const reqPets: Set<ObjectId> = new Set();
    while (reqPets.size === 0) {
      pets.filter(randBool).forEach((p) => reqPets.add(p._id));
    }

    return Array.from(reqPets);
  }

  /**
   * Generates 1-4 random broad requests for each owner
   */
  private async genBroadRequests(owners: Owner[]) {
    for (const owner of owners) {
      const numBroad = randNum(1, 4);
      for (let i = 0; i < numBroad; i++) {
        await requestService.newRequest(owner, {
          carer: null,
          pets: this.genRandomPetsForRequests(owner.pets).map((id) =>
            id.toString()
          ),
          dateRange: this.genRandomDateRange(),
          additionalInfo: "Hi, please look after my pets.",
        });
      }
    }
  }

  /**
   * Generates 1-3 random direct requests for each owner
   */
  private async genDirectRequests(owners: Owner[], carers: Carer[]) {
    for (const owner of owners) {
      const numDirect = randNum(1, 3);
      for (let i = 0; i < numDirect; i++) {
        const carer = carers[randNum(0, carers.length - 1)];
        await requestService.newRequest(owner, {
          carer: carer._id.toString(),
          pets: this.genRandomPetsForRequests(owner.pets).map((id) =>
            id.toString()
          ),
          dateRange: this.genRandomDateRange(),
          additionalInfo: "Hi, please look after my pets.",
        });
      }
    }
  }

  /**
   * Generates feedback for carer -> owner, carer -> pet and then owner -> carer
   */
  private async genFeedback(carers: Carer[], owners: Owner[]) {
    for (const carer of carers) {
      for (const owner of owners) {
        if (randChance(2)) continue;

        await feedbackService.newUserFeedback(
          carer,
          owner._id.toString(),
          randOwnerReview()
        );

        for (const pet of owner.pets) {
          if (randChance(2)) continue;

          await feedbackService.newPetFeedback(
            carer,
            pet._id.toString(),
            randPetReview()
          );
        }
      }
    }

    for (const owner of owners) {
      for (const carer of carers) {
        if (randChance(2)) continue;

        await feedbackService.newUserFeedback(
          owner,
          carer._id.toString(),
          randCarerReview()
        );
      }
    }
  }

  /**
   * Generate a chance that the carer could reject or accept any offers they
   * have recieved
   */
  private async acceptOffers(carers: Carer[]) {
    for (const carer of carers) {
      for (const offer of carer.offers) {
        if (randChance(5)) {
          await carerService.rejectOffer(
            carer,
            offer.requestId.toString(),
            offer.offerType
          );
          continue;
        }

        if (randChance(2)) {
          await carerService.acceptOffer(
            carer,
            offer.requestId.toString(),
            offer.offerType
          );
        }
      }
    }
  }

  /**
   * Generate a chance that the owner can accept any carers that have responded
   */
  private async acceptCarers(owners: Owner[]) {
    for (const owner of owners) {
      for (const request of owner.requests) {
        if (request.carer !== null) {
          continue;
        }

        const respondent =
          request.respondents[randNum(0, request.respondents.length - 1)];
        if (respondent && randChance(2)) {
          await requestService.acceptRespondent(
            owner,
            request._id.toString(),
            respondent.toString()
          );
        }
      }
    }
  }

  /**
   * Generate a chance that the carer completes a job they have accepted
   */
  private async completeJobs(carers: Carer[]) {
    for (const carer of carers) {
      for (const offer of carer.offers) {
        if (offer.status !== "accepted") {
          continue;
        }

        if (randChance(3)) {
          await carerService.completeCarerOffer(
            carer,
            offer.requestId.toString()
          );
        }
      }
    }
  }

  /**
   * Generates some amount of likes and comments for each review
   */
  private async genCommentsAndLikes(carers: Carer[], owners: Owner[]) {
    const users = [...carers, ...owners];
    const randUser = () => users[randNum(0, users.length - 1)];

    const genLikes = async (user: User, review: Feedback) => {
      const numLikes = randNum(0, 5);
      for (let i = 0; i < numLikes; i++) {
        await feedbackService.likeUserFeedback(
          randUser(),
          user._id.toString(),
          review._id.toString()
        );
      }
    };

    const genComments = async (user: User, review: Feedback) => {
      const numComents = randNum(1, 3);
      for (let i = 0; i < numComents; i++) {
        const author = randUser();
        await feedbackService.commentOnFeedback(
          author,
          user._id.toString(),
          review._id.toString(),
          { message: randComment() }
        );
      }
    };

    const genPetLikes = async (pet: Pet, review: Feedback) => {
      const numLikes = randNum(0, 3);
      for (let i = 0; i < numLikes; i++) {
        await feedbackService.likePetFeedback(
          randUser(),
          pet._id.toString(),
          review._id.toString()
        );
      }
    };

    const genPetComments = async (pet: Pet, review: Feedback) => {
      const numComents = randNum(1, 3);
      for (let i = 0; i < numComents; i++) {
        const author = randUser();
        await feedbackService.commentOnPetFeedback(
          author,
          pet._id.toString(),
          review._id.toString(),
          { message: randComment() }
        );
      }
    };

    for (const user of users) {
      for (const review of user.feedback) {
        if (randChance(2)) {
          continue;
        }
        await genLikes(user, review);
        await genComments(user, review);
      }
    }

    console.log("liked/commented on user reviews");

    for (const owner of owners) {
      for (const pet of owner.pets) {
        for (const review of pet.feedback) {
          if (randChance(3)) {
            continue;
          }
          await genPetLikes(pet, review);
          await genPetComments(pet, review);
        }
      }
    }

    console.log("liked/commented on pet reviews");
  }
}

const dataGenerator = new DataGeneratorService();

export default dataGenerator;
