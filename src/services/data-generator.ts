import prand from "pure-rand";
import { carerCollection, ownerCollection, userCollection } from "../mongo";
import { Pet, petSizes, petTypes } from "../models/pet";
import { Carer } from "../models/carer";
import { ObjectId } from "mongodb";
import { Owner } from "../models/owner";
import { User, UserLocation } from "../models/user";
import { Request } from "../models/request";
import { Comment, Feedback } from "../models/feedback";

// seed == 3 because it is first seed where carer1@email.com has a direct request
const DEFAULT_SEED = 3;

class DataGeneratorService {
  private seed: number;
  private rng: prand.RandomGenerator;

  constructor(seed?: number) {
    this.seed = seed ?? DEFAULT_SEED;
    this.rng = prand.mersenne(this.seed);
  }

  private randNum(min: number, max: number): number {
    const [num, next_rng] = prand.uniformIntDistribution(min, max, this.rng);
    this.rng = next_rng;
    console.log(`got random num ${num}`);
    return num;
  }

  private randBool(): boolean {
    const [num, next_rng] = prand.uniformIntDistribution(0, 1, this.rng);
    this.rng = next_rng;
    console.log(`got random bool ${num == 0}`);
    return num == 0;
  }

  async generate() {
    // drops everything
    await userCollection.deleteMany({});

    const carers = this.genCarers();
    const owners = this.genOwners(carers);
    this.genFeedback(carers, owners);
    this.genCommentsAndLikes(carers, owners);

    await carerCollection.insertMany(carers);
    await ownerCollection.insertMany(owners);

    console.log(owners, carers);
  }

  private genCarers() {
    // return either a random selection of pet types or all pet types
    // (no carer should prefer nothing)
    const genPreferredPetTypes = () => {
      const genPetTypes = petTypes.filter(this.randBool);
      return genPetTypes.length === 0 ? petTypes : genPetTypes;
    };

    const genPreferredPetSizes = () => {
      const genPetSizes = petSizes.filter(this.randBool);
      return genPetSizes.length === 0 ? petSizes : genPetSizes;
    };

    const newCarer: (num: number) => Carer = (num) => {
      return {
        _id: new ObjectId(),
        email: `carer${num}@email.com`,
        password: "password",
        name: `Carer ${num}`,
        userType: "carer",
        phone: "0412345678",
        bio: `My name is Carer ${num}, I would like to care for your pet`,
        location: this.genLocation(),
        notifications: [],
        feedback: [],
        skillsAndExp: "Skills and Experience",
        preferredTravelDistance: 50000,
        hourlyRate: 50,
        offers: [],
        jobs: [],
        unavailabilities: [],
        preferredPetTypes: genPreferredPetTypes(),
        preferredPetSizes: genPreferredPetSizes(),
        licences: [],
      };
    };

    const carers: Array<Carer> = [];
    for (let i = 1; i <= 20; i++) {
      carers.push(newCarer(i));
    }
    return carers;
  }

  private genOwners(carers: Array<Carer>) {
    const newOwner: (num: number) => Owner = (num) => {
      return {
        _id: new ObjectId(),
        email: `owner${num}@email.com`,
        password: "password",
        name: `Owner ${num}`,
        phone: "0412345678",
        bio: `My name is Owner ${num}, I have pets that need caring for.`,
        userType: "owner",
        location: this.genLocation(),
        notifications: [],
        feedback: [],
        pets: this.genPets(),
        requests: [],
      };
    };

    const owners: Array<Owner> = [];
    for (let i = 1; i <= 10; i++) {
      const owner = newOwner(i);
      this.genBroadRequests(owner, carers);
      this.genDirectRequests(owner, carers);
      owners.push(owner);
    }

    return owners;
  }

  private genLocation(): UserLocation {
    const sydneyCoords = { lat: 33.8688, lng: 151.2093 };
    const wollongongCoords = { lat: 34.4248, lng: 150.8931 };

    const city = this.randBool();
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

  private genPets(): Array<Pet> {
    const newPet: (num: number) => Pet = (num) => {
      const petType = petTypes[this.randNum(0, 3)];
      const petSize = petSizes[this.randNum(0, 3)];

      return {
        _id: new ObjectId(),
        name: `${petType} ${num}`,
        petType,
        petSize,
        isVaccinated: this.randBool(),
        isFriendly: this.randBool(),
        isNeutered: this.randBool(),
        feedback: [],
      };
    };

    const pets: Array<Pet> = [];
    const numPets = this.randNum(1, 5);
    for (let i = 1; i <= numPets; i++) {
      pets.push(newPet(i));
    }

    return pets;
  }

  // generate random pets ensuring that at lease one pet has been added
  private genRandomPetsForRequests(pets: Array<Pet>) {
    const reqPets: Set<ObjectId> = new Set();
    while (reqPets.size === 0) {
      pets.filter(this.randBool).forEach((p) => reqPets.add(p._id));
    }

    return Array.from(reqPets);
  }

  private genBroadRequests(owner: Owner, carers: Array<Carer>) {
    const newBroadRequest: (o: Owner) => Request = (o) => {
      return {
        _id: new ObjectId(),
        carer: null,
        status: "pending",
        respondents: [],
        requestedOn: new Date(),
        pets: this.genRandomPetsForRequests(o.pets),
        dateRange: {
          startDate: new Date(Date() + 60 * 60 * 60 * 24),
          endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
        },
        additionalInfo: "Hi, please look after my pets.",
      };
    };

    const genRespondents: (request: Request) => void = (request) => {
      const respondents: Map<ObjectId, boolean> = new Map();

      const numResp = this.randNum(1, 4);
      while (respondents.size < numResp) {
        const carer = carers[this.randNum(0, carers.length - 1)];
        respondents.set(carer._id, true);
      }

      [...respondents.keys()].forEach((r) => {
        request.respondents.push(r);
        carers
          .find((c) => c._id === r)
          ?.offers.push({
            requestId: request._id,
            offerType: "broad",
            status: "pending",
          });
      });

      request.respondents = [...respondents.keys()];
    };

    const broad: Array<Request> = [];
    const numBroad = this.randNum(1, 4);
    for (let i = 0; i < numBroad; i++) {
      const b = newBroadRequest(owner);
      genRespondents(b);

      broad.push(b);
    }

    owner.requests.push(...broad);
  }

  private genDirectRequests(owner: Owner, carers: Array<Carer>) {
    const newDirectRequest: (owner: Owner, carer: Carer) => Request = (
      o,
      c
    ) => {
      return {
        _id: new ObjectId(),
        carer: c._id,
        status: "pending",
        respondents: [],
        requestedOn: new Date(),
        pets: this.genRandomPetsForRequests(owner.pets),
        dateRange: {
          startDate: new Date(Date() + 60 * 60 * 60 * 24),
          endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
        },
        additionalInfo: `Hi ${c.name}, please look after my pets.`,
      };
    };

    const direct: Array<Request> = [];
    const numDirect = this.randNum(1, 3);
    for (let i = 0; i < numDirect; i++) {
      const carer = carers[this.randNum(0, carers.length - 1)];
      const d = newDirectRequest(owner, carer);
      carer.offers.push({
        requestId: d._id,
        offerType: "direct",
        status: "pending",
      });
      direct.push(d);
    }

    owner.requests.push(...direct);
  }

  private genFeedback(carers: Array<Carer>, owners: Array<Owner>) {
    const newFeedback: (author: User) => Feedback = (author) => {
      const feedback: Feedback = {
        _id: new ObjectId(),
        authorId: author._id,
        authorName: author.name ?? "",
        postedOn: new Date(),
        message: `My name is ${author.name} and I am leaving some feedback`,
        likes: [],
        comments: [],
      };

      // create a 1/4 chance of no rating
      if (this.randNum(0, 3) !== 3) {
        feedback.rating = this.randNum(0, 5);
      }

      return feedback;
    };

    // add some carer reviews to owners and pets
    carers.forEach((c) =>
      owners
        .filter(() => this.randNum(0, 4) === 4)
        .forEach((o) => {
          o.feedback.push(newFeedback(c));
          // give a small chance for the carer to also review a pet
          o.pets
            .filter(() => this.randNum(0, 5) === 5)
            .forEach((p) => p.feedback.push(newFeedback(c)));
        })
    );

    // add some owner reviews to carers
    owners.forEach((o) =>
      carers
        .filter(() => this.randNum(0, 2) === 2)
        .forEach((c) => {
          c.feedback.push(newFeedback(o));
        })
    );
  }

  private genCommentsAndLikes(carers: Array<Carer>, owners: Array<Owner>) {
    const users = [...carers, ...owners];
    const randUser = () => users[this.randNum(0, users.length - 1)];

    const genLikes = () => {
      const likes = [];
      const numLikes = this.randNum(0, 10);
      for (let i = 0; i < numLikes; i++) {
        likes.push(randUser()._id);
      }

      return likes;
    };

    const newComment = (user: User): Comment => {
      return {
        authorId: user._id,
        authorName: user.name ?? "",
        postedOn: new Date(),
        message: "Nice review!",
      };
    };

    const genComments = () => {
      const comments = [];
      const numComents = this.randNum(0, 5);
      for (let i = 0; i < numComents; i++) {
        comments.push(newComment(randUser()));
      }

      return comments;
    };

    // generate likes for each carer review
    carers.forEach((c) =>
      c.feedback.forEach((feedback) => {
        feedback.likes = genLikes();
        feedback.comments = genComments();
      })
    );

    // generate likes for each owner review
    owners.forEach((o) =>
      o.feedback.forEach((feedback) => {
        feedback.likes = genLikes();
        feedback.comments = genComments();
      })
    );
  }
}

const dataGenerator = new DataGeneratorService();

export default dataGenerator;
