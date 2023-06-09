import express from 'express';
import { 
    initMongoClient, 
    getMongoClient, 
    closeMongoClient 
} from './db.js';
import bodyParser from 'body-parser';
import authRouter from './auth.js';

const app = express();
const port = 5000;

await initMongoClient();

app.use(bodyParser.json())

app.get('/', (_, res) => {
    res.status(200).send('Hello world')
});

app.listen(port, () => console.log(`Running on port ${port}`));

app.use(authRouter);

async function testMongo() {
    let client = await getMongoClient();
    await client.db('admin').command({ping: 1});
    console.log("MongoDB successfully pinged");
    await closeMongoClient();
}

await testMongo();