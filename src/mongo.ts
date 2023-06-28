import { Collection, Db, MongoClient } from "mongodb";
import { User } from "./models/interfaces";
import dotenv from 'dotenv'

dotenv.config()

const mongo_url = process.env.MONGODB_URL ?? "";
const mongo_db = process.env.MONGODB_DB ?? "";

let client: MongoClient | null = null;

const database = async() => {
    if (client) return client.db(mongo_db).collection<User>("users");
    client  = await MongoClient.connect(mongo_url);
    return client.db(mongo_db).collection<User>("users");
}

const mongo = {
    database
}

export default mongo;