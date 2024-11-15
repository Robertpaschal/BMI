const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const jwt = require('jsonwebtoken');
const { Queue } = require('bullmq');
const redisClient = require('../config/redis');
const User = require('../models/User');

console.log('Redis URL in Queue:', process.env.REDIS_URL);

class EmailQueue {
    constructor() {
        // Create a Bull queue for email sending
        this.queue = new Queue('email', {
            connection: redisClient.client,
        });

        //Logging the Redis URL for debugging
        console.log('Initializing Redis connection for queue with URL:', process.env.REDIS_URL);

        //Error handling for the queue
        this.queue.on('error', (error) => {
            console.error('Email Queue error:', error);
        });
    }

    // Method to generate password reset token and add email job to queue
    async SendPasswordResetEmail(email, resetCode) {
        try {
            email = String(email).trim();
            // Find user by email
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }

            // Push the email sending task to the BullMQ Queue
            await this.queue.add('send-password-reset-code', {
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

    // Method to add email verification to queue
    async SendVerificationEmail(email, fullname, verificationCode) {
        try {
            await this.queue.add('send-verification-email', {
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

    // Method to add a temporary password email to the queue
    async sendTempPasswordEmail(email, fullname, tempPassword) {
        try {
            await this.queue.add('send-temp-password', {
                email,
                fullname,
                tempPassword,
            });
            console.log(`Temporary password email for ${email} added to the queue.`);
        } catch (error) {
            console.error('Error adding email job to the queue:', error);
            throw error;
        }
    }
}

module.exports = new EmailQueue();