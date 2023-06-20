import express from 'express';
import bodyParser from 'body-parser';
import authRouter from './auth.js';
import dotenv from 'dotenv'
import { initMongooseInstance } from "./db.js";

dotenv.config()

const app = express();
const port = process.env.SERVER_PORT;

await initMongooseInstance();

app.use(bodyParser.json())

app.get('/', (_, res) => {
    res.status(200).send('Hello world')
});

app.listen(port, () => console.log(`Running on port ${port}`));

app.use(authRouter);