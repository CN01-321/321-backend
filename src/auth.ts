import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';


const jwtSecret = 'secret';

const authRouter = Router();
export default authRouter;

type TokenUser  = {
    id: number,
    email: string
    password: string
}

const users: Array<TokenUser> = [
    { id: 1, email: '1@email.com', password: '1' },
    { id: 2, email: '2@email.com', password: '2' },
    { id: 3, email: '3@email.com', password: '3' },
];


const signUpOptions = {
    usernameField: 'email', 
    passwordField: 'password' 
}

const authOptions = { session: false };

passport.use('login', new LocalStrategy(signUpOptions, (email, password, callback) => {
    let user = users.find(u => u.email === email && u.password === password)

    if (!user) return callback(null, false);

    return callback(null, user);
}));

authRouter.post(
    '/login', 
    passport.authenticate('login', authOptions),
    async (req, res) => {
        console.log(req.body)
        console.log(req.user);

        const user = req.user as TokenUser;

        const body = { id: user.id, email: user.email };
        const token = jwt.sign({user: body}, jwtSecret);

        res.json({ token });
    }
)


passport.use('signup', new LocalStrategy(signUpOptions, (email, password, done) => {
    let user = {
        id: users.length + 1,
        email,
        password,
        token: ''
    };
    users.push(user);
    return done(null, user);
}));


authRouter.post(
    '/signup', 
    passport.authenticate('signup', authOptions), 
    async (req, res) => {
        res.json(req.user);
    }
);


const jwtOpts = {
    secretOrKey: jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

passport.use(
    'jwt',
    new JwtStrategy(jwtOpts, (token, done) => {
        console.log(token);

        const user = users.find(u => u.email === token.user.email);

        if (!user) return done(null, false);

        return done(null, user);
    }
));

authRouter.post('/needs-token', passport.authenticate('jwt', authOptions), (req, res) => {
    res.status(200).json({ok:"is ok"});
})
