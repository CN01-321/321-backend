import passport, { AuthenticateOptions } from 'passport'
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
import { CarerModel, OwnerModel, UserModel } from './models/models.js';
import User, { UserType } from './models/user.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? "";

const authRouter = Router();
export default authRouter;

const signUpOptions = {
    usernameField: 'email', 
    passwordField: 'password' 
}

const authOptions: AuthenticateOptions = { 
    session: false
};

// set up middleware to verify that a user's email and password exisits in the system
// return the user to the next function ('/login') or fail (returning 401 to the caller) 
passport.use('login', new LocalStrategy(signUpOptions, async (email, password, callback) => {
    console.log("login", email, password);

    const user = await UserModel.findOne({email: email, password: password})

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

    if (await UserModel.exists({email})) {
        throw "Email is already in use.";
    }
    
}

authRouter.post("/owners", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        await valdateSignUpRequest(email, password)
    } 
    catch (e) {
        res.status(400).send(e);
        return; 
    }

    const owner = new OwnerModel({ email, password });
    await owner.save();

    console.log("Created new Owner", owner);
    res.sendStatus(200);
})

authRouter.post("/carers", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        await valdateSignUpRequest(email, password)
    } 
    catch (e) {
        res.status(400).send(e);
        return;
    }

    const carer = new CarerModel({ email, password });
    await carer.save();

    console.log("Created new Carer", carer);
    res.sendStatus(200);
})



// set up signup middleware, does most of the heavy lifting by creating a new user
// and saving it to the database, on success it returns the new user to the next
// function ('/signup')
passport.use('signup', new LocalStrategy(signUpOptions, async (email, password, done) => {
    const randomUserType = () => (Math.random() < 0.5) ? UserType.OWNER : UserType.CARER;

    if (await UserModel.exists({email})) {
        return done(null, false, { message: `Email: ${email} is already in use.`})
    }

    let user;
    if (randomUserType() === UserType.OWNER) {
        user = new OwnerModel({email, password})
    } else {
        user = new CarerModel({email, password})
    }

    try {
        await user.save()
    } catch (e) {
        return done(e, false);
    }

    console.log('created new user: ', user);

    return done(null, user);
}));


authRouter.post('/signup', passport.authenticate('signup', authOptions), (req, res) => {
    console.log("signed user up", req.user)
    res.json(req.user);
});


const jwtOpts = {
    secretOrKey: jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

// sets up jwt middleware for routes that require a user to be logged in
// decodes the given token and if valid it tries to find the user associated with the email
// passes that user to the next function, or otherwilse returns a 401 to the caller
passport.use(
    'jwt',
    new JwtStrategy(jwtOpts, (token, done) => {
        const user = UserModel.findOne({'email': token.user.email})
        if (!user) return done(null, false);
        return done(null, user);
    }
));

authRouter.get('/needs-token', passport.authenticate('jwt', authOptions), (req, res) => {
    res.send('got message');
})

