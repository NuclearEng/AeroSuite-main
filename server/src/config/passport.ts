import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { UserModel, User } from '../models/user.model';
import config from './config';

export default function configurePassport() {
  // Serialize user for the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google OAuth Strategy
  if (config.oauth.google.enabled) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.google.clientId,
          clientSecret: config.oauth.google.clientSecret,
          callbackURL: `${config.baseUrl}/api/auth/sso/google/callback`,
          scope: ['profile', 'email'],
          state: true
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await UserModel.findOne({
              $or: [
                { 'oauth.google.id': profile.id },
                { email: profile.emails?.[0]?.value }
              ]
            });

            if (user) {
              // Update OAuth information if user exists
              if (!user.oauth?.google?.id) {
                user.oauth = {
                  ...user.oauth,
                  google: {
                    id: profile.id,
                    accessToken,
                    refreshToken: refreshToken || undefined
                  }
                };
                await user.save();
              }
              return done(null, user);
            }

            // Create new user if doesn't exist
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('Email address is required'), undefined);
            }

            const newUser = await UserModel.create({
              firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
              lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
              email: email,
              emailVerified: true, // Email is verified through Google
              password: undefined, // No password for OAuth users
              role: 'user',
              isActive: true,
              oauth: {
                google: {
                  id: profile.id,
                  accessToken,
                  refreshToken: refreshToken || undefined
                }
              },
              avatar: profile.photos?.[0]?.value
            });

            return done(null, newUser);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  // Microsoft OAuth Strategy
  if (config.oauth.microsoft.enabled) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: config.oauth.microsoft.clientId,
          clientSecret: config.oauth.microsoft.clientSecret,
          callbackURL: `${config.baseUrl}/api/auth/sso/microsoft/callback`,
          scope: ['user.read'],
          tenant: config.oauth.microsoft.tenant || 'common',
          state: true
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await UserModel.findOne({
              $or: [
                { 'oauth.microsoft.id': profile.id },
                { email: profile._json.mail || profile._json.userPrincipalName }
              ]
            });

            if (user) {
              // Update OAuth information if user exists
              if (!user.oauth?.microsoft?.id) {
                user.oauth = {
                  ...user.oauth,
                  microsoft: {
                    id: profile.id,
                    accessToken,
                    refreshToken: refreshToken || undefined
                  }
                };
                await user.save();
              }
              return done(null, user);
            }

            // Create new user if doesn't exist
            const email = profile._json.mail || profile._json.userPrincipalName;
            if (!email) {
              return done(new Error('Email address is required'), undefined);
            }

            const newUser = await UserModel.create({
              firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
              lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
              email: email,
              emailVerified: true, // Email is verified through Microsoft
              password: undefined, // No password for OAuth users
              role: 'user',
              isActive: true,
              oauth: {
                microsoft: {
                  id: profile.id,
                  accessToken,
                  refreshToken: refreshToken || undefined
                }
              }
            });

            return done(null, newUser);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  return passport;
} 