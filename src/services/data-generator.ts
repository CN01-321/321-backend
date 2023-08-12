import prand from "pure-rand";
import { carerCollection, ownerCollection, userCollection } from "../mongo.js";
import { Pet, petSizes, petTypes } from "../models/pet.js";
import { Carer } from "../models/carer.js";
import { ObjectId } from "mongodb";
import { Owner } from "../models/owner.js";
import { User, UserLocation } from "../models/user.js";
import { Feedback } from "../models/feedback.js";
import ownerService, { AddPetForm } from "./owner.js";
import requestService from "./request.js";
import feedbackService, { NewFeedbackForm } from "./feedback.js";
import carerService from "./carer.js";

// seed == 3 because it is first seed where carer1@email.com has a direct request
const DEFAULT_SEED = 3;
let rng = prand.mersenne(DEFAULT_SEED);

function randNum(min: number, max: number): number {
  const [num, next_rng] = prand.uniformIntDistribution(min, max, rng);
  rng = next_rng;
  return num;
}

function randBool(): boolean {
  return randNum(0, 0) == 0;
}

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

class DataGeneratorService {
  async generate() {
    // drops everything
    await userCollection.deleteMany({});

    await this.genCarers();
    await this.genOwners();
    let carers = await carerCollection.find({ userType: "carer" }).toArray();
    let owners = await ownerCollection.find({ userType: "owner" }).toArray();

    console.log("Generated owners and carers: ", owners, carers);

    await this.genBroadRequests(owners);
    console.log("Generated broad requests");
    await this.genDirectRequests(owners, carers);
    console.log("Generated direct requests");

    await this.genFeedback(carers, owners);
    console.log("Generated feedback");

    carers = await carerCollection.find({ userType: "carer" }).toArray();
    await this.acceptOffers(carers);
    console.log("Accepted Offers");

    carers = await carerCollection.find({ userType: "carer" }).toArray();
    console.log("carers after accept offers: ", carers);

    owners = await ownerCollection.find({ userType: "owner" }).toArray();
    await this.genCommentsAndLikes(carers, owners);
    console.log("Generated Comments and Likes");
  }

  private async genCarers() {
    // return either a random selection of pet types or all pet types
    // (no carer should prefer nothing)
    const genPreferredPetTypes = () => {
      const genPetTypes = petTypes.filter(randBool);
      return genPetTypes.length === 0 ? petTypes : genPetTypes;
    };

    const genPreferredPetSizes = () => {
      const genPetSizes = petSizes.filter(randBool);
      return genPetSizes.length === 0 ? petSizes : genPetSizes;
    };

    for (let i = 1; i <= 20; i++) {
      const carer: Carer = {
        _id: createObjectId(),
        email: `carer${i}@email.com`,
        password: "password",
        name: `Carer ${i}`,
        userType: "carer",
        phone: "0412345678",
        bio: `My name is Carer ${i}, I would like to care for your pet`,
        location: this.genLocation(),
        notifications: [],
        feedback: [],
        skillsAndExp: "Skills and Experience",
        preferredTravelDistance: 50000,
        hourlyRate: 50,
        offers: [],
        preferredPetTypes: genPreferredPetTypes(),
        preferredPetSizes: genPreferredPetSizes(),
      };

      await carerCollection.insertOne(carer);
    }
  }

  private async genOwners() {
    for (let i = 1; i <= 10; i++) {
      const owner: Owner = {
        _id: createObjectId(),
        email: `owner${i}@email.com`,
        password: "password",
        name: `Owner ${i}`,
        phone: "0412345678",
        bio: `My name is Owner ${i}, I have pets that need caring for.`,
        userType: "owner",
        location: this.genLocation(),
        notifications: [],
        feedback: [],
        pets: [],
        requests: [],
      };

      await ownerCollection.insertOne(owner);
      console.log("inserted");
      await this.genPets(owner);
    }
  }

  private genLocation(): UserLocation {
    const sydneyCoords = { lat: 33.8688, lng: 151.2093 };
    const wollongongCoords = { lat: 34.4248, lng: 150.8931 };

    const city = randBool();
    const coords = city ? sydneyCoords : wollongongCoords;

    return {
      type: "Point",
      coordinates: [coords.lng, coords.lat],
      state: "NSW",
      city: city ? "Sydney" : "Wollongong",
      street: city ? "Sydney St" : "Wollongong Way",
      postcode: city ? "2000" : "2500",
    };
  }

  private async genPets(owner: Owner) {
    const newPet: (num: number) => AddPetForm = (num) => {
      const petType = petTypes[randNum(0, 3)];
      const petSize = petSizes[randNum(0, 2)];

      return {
        name: `${petType} ${num}`,
        petType,
        petSize,
        isVaccinated: randBool(),
        isFriendly: randBool(),
        isNeutered: randBool(),
      };
    };

    const numPets = randNum(1, 5);
    for (let i = 1; i <= numPets; i++) {
      await ownerService.addPet(owner, newPet(i));
    }
  }

  // generate random pets ensuring that at lease one pet has been added
  private genRandomPetsForRequests(pets: Pet[]) {
    const reqPets: Set<ObjectId> = new Set();
    while (reqPets.size === 0) {
      pets.filter(randBool).forEach((p) => reqPets.add(p._id));
    }

    return Array.from(reqPets);
  }

  private async genBroadRequests(owners: Owner[]) {
    for (const owner of owners) {
      const numBroad = randNum(1, 4);
      for (let i = 0; i < numBroad; i++) {
        await requestService.newRequest(owner, {
          carer: null,
          pets: this.genRandomPetsForRequests(owner.pets).map((id) =>
            id.toString()
          ),
          dateRange: {
            startDate: new Date(Date() + 60 * 60 * 60 * 24),
            endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
          },
          additionalInfo: "Hi, please look after my pets.",
        });
      }
    }
  }

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
          dateRange: {
            startDate: new Date(Date() + 60 * 60 * 60 * 24),
            endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
          },
          additionalInfo: "Hi, please look after my pets.",
        });
      }
    }
  }

  private async genFeedback(carers: Carer[], owners: Owner[]) {
    const newFeedback: (author: User) => NewFeedbackForm = (author) => {
      const feedback: NewFeedbackForm = {
        message: `My name is ${author.name} and I am leaving some feedback`,
      };

      // create a 1/4 chance of no rating
      if (randNum(0, 3) !== 3) {
        feedback.rating = randNum(0, 5);
      }

      return feedback;
    };

    for (const carer of carers) {
      for (const owner of owners) {
        if (randNum(0, 4) === 4) continue;

        await feedbackService.newUserFeedback(
          carer,
          owner._id.toString(),
          newFeedback(carer)
        );

        for (const pet of owner.pets) {
          if (randNum(0, 5) !== 5) continue;

          await feedbackService.newPetFeedback(
            carer,
            pet._id.toString(),
            newFeedback(carer)
          );
        }
      }
    }

    for (const owner of owners) {
      for (const carer of carers) {
        if (randNum(0, 2) !== 2) continue;

        await feedbackService.newUserFeedback(
          owner,
          carer._id.toString(),
          newFeedback(owner)
        );
      }
    }
  }

  private async acceptOffers(carers: Carer[]) {
    for (const carer of carers) {
      for (const offer of carer.offers) {
        const chance = randNum(0, 10);

        if (chance < 3) {
          continue;
        } else if (chance < 8) {
          await carerService.acceptOffer(
            carer,
            offer.requestId.toString(),
            offer.offerType
          );
        } else {
          await carerService.rejectOffer(
            carer,
            offer.requestId.toString(),
            offer.offerType
          );
        }
      }
    }
  }

  private async genCommentsAndLikes(carers: Carer[], owners: Owner[]) {
    const users = [...carers, ...owners];
    const randUser = () => users[randNum(0, users.length - 1)];

    const genLikes = async (user: User, review: Feedback) => {
      const numLikes = randNum(0, 10);
      for (let i = 0; i < numLikes; i++) {
        await feedbackService.likeUserFeedback(
          randUser(),
          user._id.toString(),
          review._id.toString()
        );
      }
    };

    const genComments = async (user: User, review: Feedback) => {
      const numComents = randNum(0, 5);
      for (let i = 0; i < numComents; i++) {
        const author = randUser();
        await feedbackService.commentOnFeedback(
          author,
          user._id.toString(),
          review._id.toString(),
          { message: "Nice Review!" }
        );
      }
    };

    const genPetLikes = async (pet: Pet, review: Feedback) => {
      const numLikes = randNum(0, 10);
      for (let i = 0; i < numLikes; i++) {
        await feedbackService.likePetFeedback(
          randUser(),
          pet._id.toString(),
          review._id.toString()
        );
      }
    };

    const genPetComments = async (pet: Pet, review: Feedback) => {
      const numComents = randNum(0, 5);
      for (let i = 0; i < numComents; i++) {
        const author = randUser();
        await feedbackService.commentOnPetFeedback(
          author,
          pet._id.toString(),
          review._id.toString(),
          { message: "Nice Review!" }
        );
      }
    };

    for (const user of users) {
      for (const review of user.feedback) {
        await genLikes(user, review);
        await genComments(user, review);
      }
    }

    console.log("Generated User comments and likes");

    for (const owner of owners) {
      for (const pet of owner.pets) {
        for (const review of pet.feedback) {
          await genPetLikes(pet, review);
          console.log("Generated Pet likes");
          await genPetComments(pet, review);
          console.log("Generated Pet comments");
        }
      }
    }

    console.log("Generated Pet comments and likes");
  }
}

const dataGenerator = new DataGeneratorService();

export default dataGenerator;
