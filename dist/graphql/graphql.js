import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import bodyParser from 'body-parser';
const { json } = bodyParser;
const typeDefs = readFileSync('schema.graphql', { encoding: 'utf-8' });
const owners = [
    {
        id: "1",
        name: "Profile 1",
        email: "profile1@email.com",
        address: "1 Northfields Ave Wollongong",
        phone: "0412345678",
        bio: "This is profile 1's bio",
        latitude: 0.0,
        longitude: 0.0,
        pfp: "/location/pfp1.png",
        feedback: [],
        pets: [],
        offer: [],
    },
    {
        id: "2",
        name: "Profile 2",
        email: "profile2@email.com",
        address: "2 Northfields Ave Wollongong",
        phone: "0422345678",
        bio: "This is profile 2's bio",
        latitude: 0.0,
        longitude: 0.0,
        pfp: "/location/pfp2.png",
        feedback: [],
        pets: [],
        offer: [],
    },
    {
        id: "3",
        name: "Profile 3",
        email: "profile3@email.com",
        address: "3 Northfields Ave Wollongong",
        phone: "0433345678",
        bio: "This is profile 3's bio",
        latitude: 0.0,
        longitude: 0.0,
        pfp: "/location/pfp3.png",
        feedback: [],
        pets: [],
        offer: [],
    },
];
const resolvers = {
    Query: {
        owner(_parent, args) {
            return owners.find((owner) => {
                console.log(owner.id, args.id);
                return owner.id === args.id;
            });
        }
    },
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
export async function initGraphQL() {
    // start the graphql server
    const { url } = await startStandaloneServer(server);
    console.log(`starting graphql on ${url}`);
}
//# sourceMappingURL=graphql.js.map