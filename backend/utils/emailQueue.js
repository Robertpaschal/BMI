const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const jwt = require('jsonwebtoken');
const { Queue } = require('bullmq');
const redisClient = require('../config/redis');
const User = require('../models/User');

console.log('Redis URL in Queue:', process.env.REDIS_URL);
// Create a Bull queue for email sending
const emailQueue = new Queue('email', {
    connection: redisClient.client,
 });
console.log('Initializing Redis connection for queue with URL:', process.env.REDIS_URL);
emailQueue.on('error', (error) => {
    console.error('Email Queue error:', error);
});

// Function to generate password reset token and add email job to queue
async function SendPasswordResetEmail(email, resetCode) {
    try {
        email = String(email).trim();
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        // Push the email sending task to the BullMQ Queue
        await emailQueue.add('send-password-reset-code', {
            email: user.email,
            fullname: user.fullname,
            resetCode: resetCode
        });
        
        console.log( `Email containing reset token added to queue for ${user.email}` );
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

// Function to add email verification to queue
async function SendVerificationEmail(email, fullname, verificationCode) {
    try {
        await emailQueue.add('send-verification-email', {
            email,
            fullname,
            verificationCode,
        });
        console.log(`Verification email for ${email} added to the queue.`);
    } catch (error) {
        console.error('Error adding email to queue:', error);
        throw error;
    }
} 

module.exports = { emailQueue, SendPasswordResetEmail, SendVerificationEmail };