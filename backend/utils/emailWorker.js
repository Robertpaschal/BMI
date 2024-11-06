const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const redisClient = require('../config/redis');

console.log('Connecting to Redis at:', process.env.REDIS_URL);

// Function to create the transporter for sending emails
function createTransporter() {
    return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// Email worker processing both password reset and verification email jobs
const emailWorker = new Worker('email', async job => {
    const transporter = createTransporter();

    if (job.name === 'send-password-reset-code') {
        const { email, fullname, resetCode } = job.data;

        console.log('Processing password reset job:', job.id, { email, fullname, resetCode });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: `Password Reset Request for ${fullname}`,
            text: `Hello ${fullname},\n\nYou requested a password reset.\n\nYour password reset code is: ${resetCode}.\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`
        };

        try {
            console.log('Sending password reset email to:', email);
            await transporter.sendMail(mailOptions);
            console.log('Password reset email sent successfully.');
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    } else if (job.name === 'send-verification-email') {
        const { email, fullname, verificationCode } = job.data;

        console.log('Processing verification email job:', job.id, { email, fullname, verificationCode });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: `Email Verification for ${fullname}`,
            text: `Hello ${fullname},\n\nYour email verification code is: ${verificationCode}.\nPlease enter this code to verify your email.\n\nThis code expires in 10 minutes.`
        };

        try {
            console.log('Sending verification email to:', email);
            await transporter.sendMail(mailOptions);
            console.log('Verification email sent successfully.');
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw error;
        }
    } else {
        console.error('Unknown job type:', job.name);
    }
}, {
    connection: redisClient.client,
});

// Event listeners for worker events
emailWorker.on('error', (error) => {
    console.error('Email Worker error:', error);
});
emailWorker.on('failed', (job, err) => {
    console.error('Job failed with error:', err);
});
emailWorker.on('completed', (job) => {
    console.log('Job completed successfully:', job.id);
});

console.log('Email Worker is running...');
