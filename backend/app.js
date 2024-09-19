#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const routes = require('./routes/routes');
const swaggerDocument = require('./config/swagger.json')
const emailWorker = require('./utils/emailWorker');

const app = express();

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
