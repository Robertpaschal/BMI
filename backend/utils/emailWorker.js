const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const redisClient = require('../config/redis');

class EmailWorker {
    constructor() {
        console.log('Connecting to Redis at:', process.env.REDIS_URL);

        // Initialize the worker with a connection to Redis
        this.worker = new Worker('email', async job => {
            await this.processJob(job);
        }, { connection: redisClient.client });

        // Attach event listeners for error handling and job completion
        this.worker.on('error', this.handleError);
        this.worker.on('failed', this.handleFailure);
        this.worker.on('completed', this.handleCompletion);

        console.log('Email Worker is running...');
    }

    // Function to create and return the nodemailer transporter
    createTransporter() {
        return nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Main function to process jobs based on job name
    async processJob(job) {
        const transporter = this.createTransporter();
        const { email, fullname } = job.data;
        console.log(`Processing ${job.name} job:`, job.id, { email, fullname, ...job.data });

        switch (job.name) {
            case 'send-password-reset-code':
                await this.sendPasswordResetEmail(transporter, email, fullname, job.data.resetCode);
                break;
            case 'send-verification-email':
                await this.sendVerificationEmail(transporter, email, fullname, job.data.verificationCode);
                break;
            case 'send-temp-password':
                await this.sendTempPasswordEmail(transporter, email, fullname, job.data.tempPassword);
                break;
            default:
                console.error('Unknown job type:', job.name);
                throw new Error(`Unknown job type: ${job.name}`);
        }
    }

    // Method to send password reset email
    async sendPasswordResetEmail(transporter, email, fullname, resetCode) {
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: `Password Reset Request for ${fullname}`,
            text: `Hello ${fullname},\n\nYou requested a password reset.\n\nYour password reset code is: ${resetCode}.\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`
        };
        await this.sendEmail(transporter, mailOptions, 'Password reset email sent successfully.');
    }

    // Method to send verification email
    async sendVerificationEmail(transporter, email, fullname, verificationCode) {
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: `Email Verification for ${fullname}`,
            text: `Hello ${fullname},\n\nYour email verification code is: ${verificationCode}.\nPlease enter this code to verify your email.\n\nThis code expires in 10 minutes.`
        };
        await this.sendEmail(transporter, mailOptions, 'Verification email sent successfully.');
    }

    // Method to send temporary password email
    async sendTempPasswordEmail(transporter, email, fullname, tempPassword) {
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: `Temporary Password for ${fullname}`,
            text: `Hello ${fullname},\n\nYou recently signed in using a social login provider. Here is your temporary password: ${tempPassword}.\nUse this password when prompted and then set a new password. It will expire in 30 minutes.\nCheers!`
        };
        await this.sendEmail(transporter, mailOptions, 'Temporary password email sent successfully.');
    }

    // Helper method to send email and log success
    async sendEmail(transporter, mailOptions, successMessage) {
        try {
            console.log(`Sending ${mailOptions.subject} to ${mailOptions.to}`);
            await transporter.sendMail(mailOptions);
            console.log(successMessage);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    // Event handlers for worker events
    handleError(error) {
        console.error('Email Worker error:', error);
    }

    handleFailure(job, error) {
        console.error(`Job ${job.id} failed with error:`, error);
    }

    handleCompletion(job) {
        console.log(`Job ${job.id} completed successfully.`);
    }
}

module.exports = new EmailWorker();
