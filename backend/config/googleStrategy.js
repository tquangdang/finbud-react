import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const createGoogleStrategy = () => {
  return new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (user) {
          return done(null, user);
        }

        user = await new User({
          email,
          accountData: {
            username: email,
            priviledge: 'user',
          },
          identityData: {
            firstName: profile.name.givenName || '',
            lastName: profile.name.familyName || '',
            displayName: profile.displayName || '',
            profilePicture: profile.photos[0]?.value || '',
          },
        }).save();

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
};

export default createGoogleStrategy;