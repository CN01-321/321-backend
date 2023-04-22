import { MongoClient, ServerApiVersion } from 'mongodb';

import * as dotenv from 'dotenv';
dotenv.config();

let mongoClient: MongoClient;

export async function initMongoClient() {
    mongoClient = new MongoClient(process.env.MONGODB_URL as string, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        }
    );

    await mongoClient.connect();
}


export function getMongoClient(): MongoClient {
    if (!mongoClient) {
        throw Error("No mongodb connection created");
    }

    return mongoClient;
}

export async function closeMongoClient() {
    await mongoClient.close();
}