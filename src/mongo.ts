import { MongoClient, ObjectId } from "mongodb";
import { User, UserLocation } from "./models/user.js";
import dotenv from "dotenv";
import { Owner } from "./models/owner.js";
import { Carer } from "./models/carer.js";
import { Pet, petSizes, petTypes } from "./models/pet.js";
import { Request } from "./models/request.js";
import prand from "pure-rand";

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

// set up an index for the location of a user
await userCollection.createIndex({ location: "2dsphere" });

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

  await carerCollection.insertMany(carers);
  await ownerCollection.insertMany(owners);

  console.log(owners, carers);
}

function genCarers() {
  const newCarer: (num: number) => Carer = (num) => {
    return {
      _id: new ObjectId(),
      email: `carer${num}@email.com`,
      password: "password",
      name: `Carer ${num}`,
      userType: "carer",
      bio: `My name is Carer ${num}, I would like to care for your pet`,
      location: genLocation(),
      notifications: [],
      receivedFeedback: [],
      skillsAndExp: "Skills and Experience",
      preferredTravelDistance: 50000,
      hourlyRate: 50,
      offers: [],
      jobs: [],
      unavailabilities: [],
      preferredPets: [],
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
      bio: `My name is Owner ${num}, I have pets that need caring for.`,
      userType: "owner",
      location: genLocation(),
      notifications: [],
      receivedFeedback: [],
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

function genBroadRequests(owner: Owner, carers: Array<Carer>) {
  const newBroadRequest: (owner: Owner) => Request = (o) => {
    return {
      _id: new ObjectId(),
      carer: null,
      status: "pending",
      respondents: [],
      requestedOn: new Date(),
      pets: owner.pets.filter(getRandBool).map((p) => p._id!),
      dateRange: {
        startDate: new Date(Date() + 60 * 60 * 60 * 24),
        endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
      },
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
      carers.find((c) => c._id === r)?.offers.push(request._id!);
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
      pets: owner.pets.filter(getRandBool).map((p) => p._id!),
      dateRange: {
        startDate: new Date(Date() + 60 * 60 * 60 * 24),
        endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
      },
    };
  };

  const direct: Array<Request> = [];
  const numDirect = getRandNum(1, 3);
  for (let i = 0; i < numDirect; i++) {
    const carer = carers[getRandNum(0, carers.length - 1)];
    const d = newDirectRequest(owner, carer);
    carer.offers.push(d._id!);
    direct.push(d);
  }

  owner.requests.push(...direct);
}
