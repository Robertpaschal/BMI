#!/usr/bin/env node

const fs = require('fs');
const dotenv = require('dotenv');
const redisClient = require('./config/redis')

// Load environment variables based on NODE_ENV (development or production)
const envFile = `.env.${ process.env.NODE_ENV }`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config(); // Default to `.env` if no specific file found
}

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const routes = require('./routes/routes');
const swaggerDocument = require('./config/swagger.json')
const emailWorker = require('./utils/emailWorker');

const app = express();

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger UI Setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// routes
app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

app.use('/', routes);

// Start the server
const PORT = process.env.PORT;
const HOST = process.env.HOSTNAME;
const ENV = process.env.NODE_ENV;
app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Server is running on http://${HOST}:${PORT} in ${process.env.NODE_ENV} mode`);
        console.log(`Swagger docs available at http://${HOST}:${PORT}/api-docs in ${ENV} mode`);
    } else {
        console.log(`Server is running at https://${HOST} in production mode`);
        console.log(`Swagger docs available at https://${HOST}/api-docs in production mode`);
    }
});

module.exports = app;
