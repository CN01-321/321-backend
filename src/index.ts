import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { 
    initMongoClient, 
    getMongoClient, 
    closeMongoClient 
} from './db.js';

import { initGraphQL } from './graphql.js';

const app = express();
const port = 5000;

await initGraphQL(app);
await initMongoClient();


app.get('/', (_, res) => {
    res.status(200).send('Hello world')
});

app.listen(port, () => console.log(`Running on port ${port}`));

async function testMongo() {
    let client = await getMongoClient();
    await client.db('admin').command({ping: 1});
    console.log("MongoDB successfully pinged");
    await closeMongoClient();
}

await testMongo();