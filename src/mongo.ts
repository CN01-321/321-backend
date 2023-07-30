import { MongoClient, ObjectId } from "mongodb";
import { User, UserLocation } from "./models/user.js";
import dotenv from "dotenv";
import { Owner } from "./models/owner.js";
import { Carer } from "./models/carer.js";
import { Pet, PetSize, PetType, petSizes, petTypes } from "./models/pet.js";
import { Request } from "./models/request.js";
import prand from "pure-rand";
import { Comment, Feedback } from "./models/feedback.js";

dotenv.config();

const mongo_url = process.env.MONGODB_URL ?? "";
const mongo_db = process.env.MONGODB_DB ?? "";

let client: MongoClient | null = null;

async function getDatabase() {
  if (client) return client.db(mongo_db);
  client = await MongoClient.connect(mongo_url);
  return client.db(mongo_db);
}

async function getUsersCollection<T extends User>() {
  return (await getDatabase()).collection<T>("users");
}

export const userCollection = await getUsersCollection<User>();
export const ownerCollection = await getUsersCollection<Owner>();
export const carerCollection = await getUsersCollection<Carer>();

// set up an index for the location of a user (required by the $geoNear operation)
await userCollection.createIndex({ location: "2dsphere" });

// set an index for emails to ensure uniquness and speed
await userCollection.createIndex({ email: 1 }, { unique: true });

// set indexes of fields frequently used in queries
await userCollection.createIndex({ "pets._id": 1 });
await userCollection.createIndex({ "requests._id": 1 });

// set up prng for seeded randomness in data generation
// seed == 3 because it is first seed where carer1@email.com has a direct request
const seed = 3;
let rng = prand.mersenne(seed);

function getRandNum(min: number, max: number): number {
  const [num, next_rng] = prand.uniformIntDistribution(min, max, rng);
  rng = next_rng;
  console.log(`got random num ${num}`);
  return num;
}

function getRandBool(): boolean {
  const [num, next_rng] = prand.uniformIntDistribution(0, 1, rng);
  rng = next_rng;
  console.log(`got random bool ${num == 0}`);
  return num == 0;
}

if (process.env.POPULATE_DB === "true") {
  console.log("populating users");
  populateDB();
}

async function populateDB() {
  // drops everything
  await userCollection.deleteMany({});

  const carers = genCarers();
  const owners = genOwners(carers);
  genFeedback(carers, owners);
  genCommentsAndLikes(carers, owners);

  await carerCollection.insertMany(carers);
  await ownerCollection.insertMany(owners);

  console.log(owners, carers);
}

function genCarers() {
  // return either a random selection of pet types or all pet types
  // (no carer should prefer nothing)
  const genPreferredPetTypes = () => {
    const genPetTypes = petTypes.filter(getRandBool);
    return genPetTypes.length === 0 ? petTypes : genPetTypes;
  };

  const genPreferredPetSizes = () => {
    const genPetSizes = petSizes.filter(getRandBool);
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
      location: genLocation(),
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

function genOwners(carers: Array<Carer>) {
  const newOwner: (num: number) => Owner = (num) => {
    return {
      _id: new ObjectId(),
      email: `owner${num}@email.com`,
      password: "password",
      name: `Owner ${num}`,
      phone: "0412345678",
      bio: `My name is Owner ${num}, I have pets that need caring for.`,
      userType: "owner",
      location: genLocation(),
      notifications: [],
      feedback: [],
      pets: genPets(),
      requests: [],
    };
  };

  const owners: Array<Owner> = [];
  for (let i = 1; i <= 10; i++) {
    const owner = newOwner(i);
    genBroadRequests(owner, carers);
    genDirectRequests(owner, carers);
    owners.push(owner);
  }

  return owners;
}

function genLocation(): UserLocation {
  const sydneyCoords = { lat: 33.8688, lng: 151.2093 };
  const wollongongCoords = { lat: 34.4248, lng: 150.8931 };

  const city = getRandBool();
  const coords = city ? sydneyCoords : wollongongCoords;

  return {
    type: "Point",
    coordinates: [coords.lng, coords.lat],
    state: "NSW",
    city: city ? "Sydney" : "Wollongong",
    street: city ? "Sydney St" : "Wollongong Way",
  };
}

function genPets(): Array<Pet> {
  const newPet: (num: number) => Pet = (num) => {
    const petType = petTypes[getRandNum(0, 3)];
    const petSize = petSizes[getRandNum(0, 3)];

    return {
      _id: new ObjectId(),
      name: `${petType} ${num}`,
      petType,
      petSize,
      isVaccinated: getRandBool(),
      isFriendly: getRandBool(),
      isNeutered: getRandBool(),
      feedback: [],
    };
  };

  const pets: Array<Pet> = [];
  const numPets = getRandNum(1, 5);
  for (let i = 1; i <= numPets; i++) {
    pets.push(newPet(i));
  }

  return pets;
}

// generate random pets ensuring that at lease one pet has been added
function genRandomPetsForRequests(pets: Array<Pet>) {
  const reqPets: Set<ObjectId> = new Set();
  while (reqPets.size === 0) {
    pets.filter(getRandBool).forEach((p) => reqPets.add(p._id!));
  }

  return Array.from(reqPets);
}

function genBroadRequests(owner: Owner, carers: Array<Carer>) {
  const newBroadRequest: (owner: Owner) => Request = (o) => {
    return {
      _id: new ObjectId(),
      carer: null,
      status: "pending",
      respondents: [],
      requestedOn: new Date(),
      pets: genRandomPetsForRequests(owner.pets),
      dateRange: {
        startDate: new Date(Date() + 60 * 60 * 60 * 24),
        endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
      },
      additionalInfo: "Hi, please look after my pets.",
    };
  };

  const genRespondents: (request: Request) => void = (request) => {
    const respondents: Map<ObjectId, boolean> = new Map();

    const numResp = getRandNum(1, 4);
    while (respondents.size < numResp) {
      const carer = carers[getRandNum(0, carers.length - 1)];
      respondents.set(carer._id!, true);
    }

    [...respondents.keys()].forEach((r) => {
      request.respondents.push(r);
      carers
        .find((c) => c._id === r)
        ?.offers.push({
          requestId: request._id!,
          offerType: "broad",
          status: "pending",
        });
    });

    request.respondents = [...respondents.keys()];
  };

  const broad: Array<Request> = [];
  const numBroad = getRandNum(1, 4);
  for (let i = 0; i < numBroad; i++) {
    const b = newBroadRequest(owner);
    genRespondents(b);

    broad.push(b);
  }

  owner.requests.push(...broad);
}

function genDirectRequests(owner: Owner, carers: Array<Carer>) {
  const newDirectRequest: (owner: Owner, carer: Carer) => Request = (o, c) => {
    return {
      _id: new ObjectId(),
      carer: c._id!,
      status: "pending",
      respondents: [],
      requestedOn: new Date(),
      pets: genRandomPetsForRequests(owner.pets),
      dateRange: {
        startDate: new Date(Date() + 60 * 60 * 60 * 24),
        endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
      },
      additionalInfo: `Hi ${c.name}, please look after my pets.`,
    };
  };

  const direct: Array<Request> = [];
  const numDirect = getRandNum(1, 3);
  for (let i = 0; i < numDirect; i++) {
    const carer = carers[getRandNum(0, carers.length - 1)];
    const d = newDirectRequest(owner, carer);
    carer.offers.push({
      requestId: d._id!,
      offerType: "direct",
      status: "pending",
    });
    direct.push(d);
  }

  owner.requests.push(...direct);
}

function genFeedback(carers: Array<Carer>, owners: Array<Owner>) {
  const newFeedback: (author: User) => Feedback = (author) => {
    const feedback: Feedback = {
      _id: new ObjectId(),
      authorId: author._id!,
      authorName: author.name!,
      postedOn: new Date(),
      message: `My name is ${author.name} and I am leaving some feedback`,
      likes: [],
      comments: [],
    };

    // create a 1/4 chance of no rating
    if (getRandNum(0, 3) !== 3) {
      feedback.rating = getRandNum(0, 5);
    }

    return feedback;
  };

  // add some carer reviews to owners and pets
  carers.forEach((c) =>
    owners
      .filter(() => getRandNum(0, 4) === 4)
      .forEach((o) => {
        o.feedback.push(newFeedback(c));
        // give a small chance for the carer to also review a pet
        o.pets
          .filter(() => getRandNum(0, 5) === 5)
          .forEach((p) => p.feedback.push(newFeedback(c)));
      })
  );

  // add some owner reviews to carers
  owners.forEach((o) =>
    carers
      .filter(() => getRandNum(0, 2) === 2)
      .forEach((c) => {
        c.feedback.push(newFeedback(o));
      })
  );
}

function genCommentsAndLikes(carers: Array<Carer>, owners: Array<Owner>) {
  const users = [...carers, ...owners];
  const randUser = () => users[getRandNum(0, users.length - 1)];

  const genLikes = () => {
    const likes = [];
    const numLikes = getRandNum(0, 10);
    for (let i = 0; i < numLikes; i++) {
      likes.push(randUser()._id!);
    }

    return likes;
  };

  const newComment = (user: User): Comment => {
    return {
      authorId: user._id!,
      authorName: user.name!,
      postedOn: new Date(),
      message: "Nice review!",
    };
  };

  const genComments = () => {
    const comments = [];
    const numComents = getRandNum(0, 5);
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
