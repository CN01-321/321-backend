import express from 'express';
import bodyParser from 'body-parser';
import authRouter from './auth.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config()

const app = express();
const mongo_url = process.env.MONGODB_URL ?? "";
const mongo_db = process.env.MONGODB_DB ?? "";
const port = process.env.SERVER_PORT;

await mongoose.connect(mongo_url, {
    dbName: mongo_db
})

app.use(bodyParser.json())

app.get('/', (_, res) => {
    res.status(200).send('Hello world')
});

app.listen(port, () => console.log(`Running on port ${port}`));

app.use(authRouter);