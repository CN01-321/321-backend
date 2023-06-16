import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, User } from './models.js';

import dotenv from 'dotenv';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? "";

const authRouter = Router();
export default authRouter;

const signUpOptions = {
    usernameField: 'email', 
    passwordField: 'password' 
}

const authOptions = { session: false };

// set up middleware to verify that a user's email and password exisits in the system
// return the user to the next function ('/login') or fail (returning 401 to the caller) 
passport.use('login', new LocalStrategy(signUpOptions, (email, password, callback) => {
    console.log("login");

    const user = User.findOne({ 'email': email, 'password': password})

    if (!user) return callback(null, false);
    return callback(null, user);
}));

// return a jwt of the user's email and user type to the caller
authRouter.post(
    '/login', 
    passport.authenticate('login', authOptions),
    async (req, res) => {
        const user = req.user as IUser;
        const body = { email: user.email, type: user.userType };

        const token = jwt.sign({user: body}, jwtSecret, {
            issuer: 'pet-carer.com',
            noTimestamp: true
        });

        console.log(token);
        res.json({ token });
    }
)

// set up signup middleware, does most of the heavy lifting by creating a new user
// and saving it to the database, on success it returns the new user to the next
// function ('/signup')
passport.use('signup', new LocalStrategy(signUpOptions, async (email, password, done) => {
    const randomUserType = () => (Math.random() < 0.5) ? 'owner' : 'carer';

    const user = new User({
        email,
        password,
        userType: randomUserType()
    });
    await user.save()

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
        const user = User.findOne({'email': token.user.email})
        if (!user) return done(null, false);
        return done(null, user);
    }
));

authRouter.get('/needs-token', passport.authenticate('jwt', authOptions), (req, res) => {
    res.send('got message');
})

