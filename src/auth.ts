import passport, { AuthenticateOptions } from 'passport'
import { IStrategyOptions, Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
// import { CarerModel, OwnerModel, PetModel, UserModel } from './models/models.js';
// import User, { UserType } from './models/user.js';
// import { Document } from 'mongoose';
// import Owner from './models/owner.js';
// import Pet from './models/pet.js';

import mongo from './mongo.js';
import { Carer, Owner, Pet, User } from './models/interfaces.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? "";

const authRouter = Router();
export default authRouter;

const signUpOptions: IStrategyOptions = {
    usernameField: 'email', 
    passwordField: 'password',
}

const authOptions: AuthenticateOptions = { 
    session: false
};

// set up middleware to verify that a user's email and password exisits in the system
// return the user to the next function ('/login') or fail (returning 401 to the caller) 
passport.use('login', new LocalStrategy(signUpOptions, async (email, password, callback) => {
    console.log("login", email, password);

    const db = await mongo.database();
    const user = await db.findOne({email, password});

    if (!user) return callback(null, false);
    return callback(null, user);
}));

// return a jwt of the user's email and user type to the caller
authRouter.post(
    '/login', 
    passport.authenticate('login', authOptions),
    async (req, res) => {
        const user = req.user as User;
        const body = { email: user.email, type: user.userType };

        console.log(body)

        const token = jwt.sign({user: body}, jwtSecret, {
            issuer: 'pet-carer.com',
            noTimestamp: true
        });

        console.log(token);
        res.json({ token });
    }
)


// TODO more stricter validation (proper emails, stronger passwords)
async function valdateSignUpRequest(email: string | undefined, password: string | undefined) {
    if (!email) {
        throw "No email present";
    } 

    if (!password) {
        throw "No password present";
    }

    const db = await mongo.database();
    if (await db.findOne({email})) {
        throw "Email is already in use.";
    }
    
}

authRouter.post("/owners", async (req, res) => {
    const newOwner: (email: string, passowrd: string) => Owner = (email: string, password: string) => {
        return {
            email, 
            password, 
            userType: "owner", 
            notifications: [], 
            receivedFeedback: [],
            pets: [],
            broadRequests: [],
            directRequests: []
        }
    }

    const email = req.body.email;
    const password = req.body.password;

    try {
        await valdateSignUpRequest(email, password)
    } 
    catch (e) {
        res.status(400).send(e);
        return; 
    }

    // const owner = new OwnerModel({ email, password });
    const db = await mongo.database();
    const owner = await db.insertOne(newOwner(email, password));

    console.log("Created new Owner", owner);
    res.sendStatus(200);
})

authRouter.post("/carers", async (req, res) => {
    const newCarer: (email: string, passowrd: string) => Carer = (email: string, password: string) => {
        return {
            email, 
            password, 
            userType: "carer", 
            notifications: [], 
            receivedFeedback: [],
            offers: [],
            unavailabilities: [],
            preferredPets: [],
            licences: []
        }
    }
    const email = req.body.email;
    const password = req.body.password;

    try {
        await valdateSignUpRequest(email, password)
    } 
    catch (e) {
        res.status(400).send(e);
        return;
    }

    const db = await mongo.database();
    const carer = db.insertOne(newCarer(email, password));

    console.log("Created new Carer", carer);
    res.sendStatus(200);
})

const jwtOpts = {
    secretOrKey: jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

// sets up jwt middleware for routes that require a user to be logged in
// decodes the given token and if valid it tries to find the user associated with the email
// passes that user to the next function, or otherwilse returns a 401 to the caller
passport.use(
    'user-jwt',
    new JwtStrategy(jwtOpts, async (token, done) => {
        const db = await mongo.database();
        const user = await db.findOne({email: token.user.email})

        if (!user) return done(null, false);
        return done(null, user);
    }
));

passport.use(
    'owner-jwt',
    new JwtStrategy(jwtOpts, async (token, done) => {
        const db = await mongo.database();
        const user = await db.findOne({email: token.user.email, userType: "owner"})

        if (!user) return done(null, false);
        return done(null, user);
    }
));

passport.use(
    'carer-jwt',
    new JwtStrategy(jwtOpts, async (token, done) => {
        const db = await mongo.database();
        const user = await db.findOne({email: token.user.email, userType: "carer"})

        if (!user) return done(null, false);
        return done(null, user);
    }
));



authRouter.get('/needs-user-token', passport.authenticate('user-jwt', authOptions), (req, res) => {
    res.send('got user message');
})

authRouter.get('/needs-owner-token', passport.authenticate('owner-jwt', authOptions), (req, res) => {
    res.send('got owner message');
})

authRouter.get('/needs-carer-token', passport.authenticate('carer-jwt', authOptions), (req, res) => {
    res.send('got carer message');
})


// authRouter.post(
//     '/owner/pet', 
//     passport.authenticate('owner-jwt', authOptions), 
//     async (req, res) => {
//         const newPet: () => Pet = () => {
//             return {
//                 name: "test pet",
//                 petType: "dog",
//                 petSize: "large",
//                 vaccinated: true,
//                 friendly: false,
//                 neutered: true,
//                 feedback: []
//             }
//         };

//         const owner = req.user as Owner;
//         const pet = newPet();

//         const db = await mongo.database();
//         await db.updateOne({email: owner.email}, { "$push": {pets: pet}})

//         res.sendStatus(200);
//     }
// );