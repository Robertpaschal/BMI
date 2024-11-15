const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require("../models/User");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const redisClient = require('./redis');
const EmailQueue = require('../utils/emailQueue');

// Generate and store temp password
async function generateTempPassword(email, fullname) {
    try {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(6).toString('hex');

        // Attempt to store the password in Redis with an expiration time of 30 minutes
        const redisSetResponse = await redisClient.set(`tempPassword:${email}`, tempPassword, 1800);
        if (!redisSetResponse) {
            throw new Error('Failed to store the temporary password in Redis');
        }

        // Send temp password to user's email
        await EmailQueue.sendTempPasswordEmail(email, fullname, tempPassword);

        return tempPassword;
    } catch (error) {
        console.error(`Error generating temp password for ${email}:`, error);
        throw new Error('Error generating temporary password. Please try again later.');
    }
}

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (sessionToken, refreshToken, profile, done) => {
    try {
        const { emails, displayName, id, ageRange, language, gender } = profile;

        let user = await User.findOne({ where: { email: emails[0].value } });
        if (user) {
            return done(null, false, { message: "This email is already associated with an existing account. Please use a different login method." });
        }

        // Generate the temporary password before user creation
        const tempPassword = await generateTempPassword(emails[0].value, displayName);

        user = await User.create({
            email: emails[0].value,
            fullname: displayName,
            username: id,
            age: ageRange || 18,
            preferredLanguage: language || English,
            gender: gender || male,
            // get height and weight and take care of other values because none can be null
            height: height || 170,
            weight: weight || 70,
            socialLogin: true,
            isSocialLogin: true,
            password: tempPassword
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}
));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'gender', 'ageRange', 'language']
},
async (sessionToken, refreshToken, profile, done) => {
    try {
        const { emails, displayName, id, ageRange, language, gender } = profile;

        let user = await User.findOne({ where: { email: emails[0].value } });
        if (user) {
            return done(null, false, { message: "This email is already associated with an existing account. Please use a different login method."});
        }

        const tempPassword = await generateTempPassword(emails[0].value, displayName);

        user = await User.create({
            email: emails[0].value,
            fullname: displayName,
            username: id,
            age: ageRange || 18,
            preferredLanguage: language || English,
            gender: gender || male,
            // get height and weight and take care of other values because none can be null
            height: height || 170,
            weight: weight || 70,
            socialLogin: true,
            isSocialLogin: true,
            password: tempPassword
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}
));

// Serialize and Deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findByPk(id);
    done(null, user);
});

module.exports = passport;