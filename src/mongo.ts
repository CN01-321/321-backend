/**
 * @file Sets up mongodb connections and indexes
 * @author George Bull
 */
import { MongoClient, ServerApiVersion } from "mongodb";
import { User } from "./models/user.js";
import dotenv from "dotenv";
import { Owner } from "./models/owner.js";
import { Carer } from "./models/carer.js";

dotenv.config();

const mongo_url = process.env.MONGODB_URL ?? "";
const mongo_db = process.env.MONGODB_DB ?? "";

let client: MongoClient | null = null;

export async function getDatabase() {
  if (client) return client.db(mongo_db);
  client = await MongoClient.connect(mongo_url, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
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
