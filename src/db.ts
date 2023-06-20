import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongooseInstance = mongoose;

export async function initMongooseInstance() {
    await mongooseInstance.connect(process.env.MONGODB_URL as string, {
        dbName: process.env.MONGODB_DB
    })
        .catch(error => console.error(error));
}

export async function getMongooseInstance() {
    if (mongooseInstance.connection.readyState === 0 ||
        mongooseInstance.connection.readyState === 3) throw Error("No MongoDB Connection Exists");
    
    return mongooseInstance;
}

export async function closeMongooseInstance() {
    await mongooseInstance.disconnect();
}