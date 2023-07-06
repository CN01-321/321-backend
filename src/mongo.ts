import { MongoClient } from "mongodb";
import { User } from "./models/user.js";
import dotenv from "dotenv";

dotenv.config();

const mongo_url = process.env.MONGODB_URL ?? "";
const mongo_db = process.env.MONGODB_DB ?? "";

let client: MongoClient | null = null;

async function getDatabase() {
  if (client) return client.db(mongo_db);
  client = await MongoClient.connect(mongo_url);
  return client.db(mongo_db);
}

export async function getCollection<T extends User>() {
  return (await getDatabase()).collection<T>("users");
}
