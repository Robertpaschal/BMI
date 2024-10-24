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
async function SendPasswordResetEmail(email) {
    try {
        email = String(email).trim();
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        // Generate a JWT token that expires in 30 minutes
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30min' });

        // Push the email sending task to the BullMQ Queue
        await emailQueue.add('send-email', {
            email: user.email,
            fullname: user.fullname,
            token: token
        });
        
        console.log( `Email containing reset token added to queue for ${user.email}` );
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

module.exports = { emailQueue, SendPasswordResetEmail };