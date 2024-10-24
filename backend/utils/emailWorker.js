const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: require('path').resolve(__dirname, '../', envFile) });

const { Worker, Queue } = require('bullmq');
const nodemailer = require('nodemailer');
const redisClient = require('../config/redis');

console.log('Connecting to Redis at:', process.env.REDIS_URL);
// Create a worker to process the email queue
function createTransporter() {
    return nodemailer.createTransport({
        //host: process.env.MAILTRAP_HOST,
        //port: process.env.MAILTRAP_PORT,
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

const emailWorker = new Worker('email', async job => {
    const { email, token, fullname } = job.data;

    console.log('Processing job:', job.id, { email, fullname, token });
    const transporter = createTransporter();
    // Create the reset URL
    const PORT = process.env.PORT;
    const resetUrl = process.env.NODE_ENV === 'production'
  ? `https://${process.env.HOSTNAME}/reset-password?token=${token}`
  : `http://${process.env.HOSTNAME}:${PORT}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: `Password Reset Request for ${fullname}`,
        text: `Hello ${fullname}.\n\nYou requested a password reset.\n\nYour token for reset is: ${token}\n\nClick here to reset your password: ${resetUrl}.\nThis link expires in 30 minutes.`
    };

    try {
        // Send the email
        console.log('Sending email to:', email);
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        console.log('Password reset email sent');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}, {
    connection: redisClient.client,
});

emailWorker.on('error', (error) => {
    console.log('Email Queue error:', error);
});
emailWorker.on('failed', (job, err) => {
    console.error('Job failed with error:', err);
});
emailWorker.on('completed', (job) => {
    console.log('Job completed:', job.id);
});

console.log('Email Worker is running...');
