import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from 'body-parser';
const { json } = bodyParser;
const typeDefs = `#graphql
    type Book {
        title: String
        author: String
    }

    type Query {
        books: [Book]
    }
`;
const books = [
    {
        title: "Book 1",
        author: "Author 1"
    },
    {
        title: "Book 2",
        author: "Author 2"
    },
];
const resolvers = {
    Query: {
        books: () => books,
    },
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
export async function initGraphQL(app) {
    // start the graphql server
    await server.start();
    app.use('/graphql', json(), expressMiddleware(server));
}
//# sourceMappingURL=graphql.js.map