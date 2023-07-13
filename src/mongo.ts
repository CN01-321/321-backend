import { MongoClient, ObjectId } from "mongodb";
import { User, UserLocation } from "./models/user.js";
import dotenv from "dotenv";
import { Owner } from "./models/owner.js";
import { Carer } from "./models/carer.js";
import { Pet, petSizes, petTypes } from "./models/pet.js";
import { Request } from "./models/request.js";

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

function populateDB() {
  const owners = genOwners();
  console.log(owners);
}

populateDB();

function genOwners() {
  const newOwner: (num: number) => Owner = (num) => {
    return {
      _id: new ObjectId(),
      email: `owner${num}@email.com`,
      password: "password",
      name: `Owner ${num}`,
      userType: "owner",
      location: genLocation(),
      notifications: [],
      receivedFeedback: [],
      pets: genPets(),
      requests: [],
    };
  };

  const owners: Array<Owner> = [];
  for (let i = 1; i < 10; i++) {
    owners.push(newOwner(i));
  }

  return owners;
}

function genLocation(): UserLocation {
  const sydneyCoords = { lat: 33.8688, lng: 151.2093 };
  const wollongongCoords = { lat: 34.4248, lng: 150.8931 };

  const city = Math.random() > 0.5;
  const coords = city ? sydneyCoords : wollongongCoords;

  return {
    state: "NSW",
    city: city ? "Sydney" : "Wollongong",
    street: city ? "Sydney St" : "Wollongong Way",
    lat: coords.lat,
    lng: coords.lng,
  };
}

function genPets(): Array<Pet> {
  const newPet: (num: number) => Pet = (num) => {
    const petType = petTypes[Math.floor(Math.random() * 4)];
    const petSize = petSizes[Math.floor(Math.random() * 4)];

    return {
      _id: new ObjectId(),
      name: `${petType} ${num}`,
      petType,
      petSize,
      isVaccinated: Math.random() > 0.5,
      isFriendly: Math.random() > 0.5,
      isNeutered: Math.random() > 0.5,
      feedback: [],
    };
  };

  const pets: Array<Pet> = [];
  const numPets = Math.floor(Math.random() * 5) + 1;
  for (let i = 1; i <= numPets; i++) {
    pets.push(newPet(i));
  }

  return pets;
}

function genBroadRequests(owner: Owner): Array<Request> {
  const newRequest: (owner: Owner) => Request = (o) => {
    return {
      _id: new ObjectId(),
      carer: null,
      isCompleted: false,
      respondents: [],
      requestedOn: new Date(),
      pets: owner.pets.filter((_) => Math.random() > 0.5).map((p) => p._id!),
      dateRange: {
        startDate: new Date(Date() + 60 * 60 * 60 * 24),
        endDate: new Date(Date() + 60 * 60 * 60 * 24 * 3),
      },
    };
  };

  const requests: Array<Request> = [];
  const numRequests = Math.floor(Math.random() * 3);
  for (let i = 0; i < numRequests; i++) {
    requests.push(newRequest(owner));
  }

  return requests;
}
