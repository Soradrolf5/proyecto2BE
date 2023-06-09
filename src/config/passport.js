import passport from 'passport';
import local from 'passport-local';
import User from '../dao/dbManagers/user.dbclass.js';
import userModel from '../dao/models/user.model.js';
import GitHubStrategy from 'passport-github';
import { createHash, isValidPassword } from '../utils.js';
import jwt from 'passport-jwt';
import dotenv from 'dotenv';

dotenv.config();

let usr = new User();
const jwtStrategy = jwt.Strategy;
const extractJwt = jwt.ExtractJwt;

const LocalStrategy = local.Strategy;

export const cookieExtractor = req => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['coderCookieToken'];
  }
  return token;
};

const initializePassport = () => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    let user = await userModel.findById(id);
    done(null, user);
  });

  passport.use(
    'github',
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:3030/api/session/githubcallback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let email = profile._json.email;
          if (!email) {
            // Si el correo electrónico no está disponible en profile._json.email, puedes buscarlo en otros lugares dentro de profile
            if (profile.emails && profile.emails.length > 0) {
              email = profile.emails[0].value;
            } else if (profile.email) {
              email = profile.email;
            }
          }

          if (!email) {
            return done(null, false, { message: 'Email not found in the GitHub profile' });
          }

          let user = await userModel.findOne({ email });
          if (!user) {
            let newUser = {
              first_name,
              last_name,
              email,
              age,
              password: createHash(password),
              cart,
            };
            let result = await userModel.create(newUser);
            return done(null, result);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    'login',
    new LocalStrategy(
      { passReqToCallback: true, usernameField: 'email' },
      async (req, email, password, done) => {
        try {
          let adminUser = { email: 'adminCoder@coder.com', password: 'adminCod3r123', role: 'admin', _id: 'admin' };
          let userLogged = adminUser;
  
          if (!email) {
            console.log('Email not sent');
            return done(null, false, { message: 'Email not sent' });
          } else if (!password) {
            console.log('Password not sent');
            return done(null, false, { message: 'Password not sent' });
          }
  
          if (email != adminUser.email) {
            const userDB = (await usr.getUserByEmail({ email })).value;
            if (!userDB) {
              console.log('User not found');
              return done(null, false, { message: 'User not found' });
            }
  
            const isValid = isValidPassword(userDB, password);
  
            if (!isValid) {
              console.log(`ERROR: Incorrect password for user ${userDB.email}`);
              return done(null, false, { message: `Incorrect password for user ${userDB.email}` });
            }
  
            userLogged = userDB;
  
            delete userDB.password;
            return done(null, userDB);
          }
  
          req.session.user = {
            id: userLogged._id,
            email: userLogged.email,
            role: userLogged.role,
          };
  
          req.session.admin = userLogged.role == 'admin' ? true : false;
          console.log(`User ${JSON.stringify(req.session.user)} logged`);
        } catch (error) {
          return done('Error logging user: ' + error);
        }
      }
    )
  );

  passport.use(
    'register',
    new LocalStrategy({ passReqToCallback: true, usernameField: 'email' }, async (req, username, password, done) => {
      const newUser = req.body;
  
      try {
        const checkUser = await User.findOne({ email: newUser.email });
  
        if (checkUser != null) {
          return done(null, false, { message: 'User already exists' });
        }
  
        newUser.password = createHash(newUser.password);
  
        const addUser = await User.create(newUser);
        console.log(`User ADDED: ${JSON.stringify(addUser)}`);
  
        req.session.user = {
          id: addUser._id,
          email: addUser.email,
          role: addUser.role,
        };
  
        return done(null, addUser);
      } catch (error) {
        return done('Error registering user: ' + error);
      }
    })
  );

 
passport.use(
  'jwt',
  new jwtStrategy(
    {
      jwtFromRequest: extractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: process.env.PRIVATE_KEY,
    },
    async (jwt_payload, done) => {
      try {
        if (!jwt_payload) {
          // El token es inválido o no está presente
          return done(null, false, { message: 'Invalid token' });
        }

        done(null, jwt_payload); // En este ejemplo, simplemente pasamos el payload del token como usuario válido
      } catch (error) {
        return done(error);
      }
    }
  )
);
}
export default initializePassport;