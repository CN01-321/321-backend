import express from 'express';
import bodyParser from 'body-parser';
import authRouter from './auth.js';
import userRouter from './routes/userRoute.js';
import ownerRouter from './routes/ownerRoute.js';
import dotenv from 'dotenv'

dotenv.config()

const mongo_url = process.env.MONGODB_URL ?? "";
const mongo_db = process.env.MONGODB_DB ?? "";

// await mongoose.connect(mongo_url, { dbName: mongo_db })

const port = process.env.SERVER_PORT;
const app = express(); 

app.use(bodyParser.json())

app.get('/', (_, res) => {
    res.status(200).send('Hello world')
});

app.listen(port, () => console.log(`Running on port ${port}`));

app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", ownerRouter);