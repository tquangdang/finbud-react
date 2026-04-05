import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';
import createGoogleStrategy from './googleStrategy.js';

// Configure Passport
// The strategy tells Passport how to check if someone's credentials are valid. 
// In this case, it's find the user by email, compare the password, return the user if it matches
const configurePassport = (app) => {
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ 'accountData.username': email });
        if (!user) {
          return done(null, false, { message: 'No account with that email' });
        }
        const match = await user.comparePassword(password);
        if (!match) {
          return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  
  // Configure Google strategy if GOOGLE_CLIENT_ID is set
  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(createGoogleStrategy());
  }

  // Serialize the user id to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize the user id from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(null, null);
    }
  });
};

export default configurePassport;