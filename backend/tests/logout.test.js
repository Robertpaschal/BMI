#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const { faker }= require('@faker-js/faker');
const app = require('../app.js');
const User = require('../models/User.js');
const redisClient = require('../config/redis.js');
const jwt = require('jsonwebtoken');

chai.use(chaiHttp);

describe('Logout Integration test', async () => {
    let user, sessionToken, refreshToken;

    before(async () => {
        await User.sequelize.sync({ force: true });
    });

    after(async () => {
        await User.sequelize.sync({ force: true });
    })

    it('should sign up a user', async () => {
        user = {
            email: faker.internet.email({ firstname: 'Any'}),
            password: faker.internet.password(),
            fullname: faker.person.fullName(),
            username: faker.internet.userName(),
            age: faker.number.int({min: 18, max: 65 }),
            gender: faker.person.sexType(),
            country: faker.location.country(),
            preferredLanguage: faker.word.noun(),
            height: faker.number.int({ min: 150, max: 200}),
            weight: faker.number.int({ min: 50, max: 100}),
        };

        const res = await chai.request(app)
        .post('/signup')
        .send(user);

        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message', 'User created successfully');
    });

    it('should log in the user', async () => {
        const res = await chai.request(app)
        .post('/login')
        .send({ email: user.email, password: user.password })

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('sessionToken');
        expect(res.body).to.have.property('refreshToken');
        
        sessionToken = res.body.sessionToken;
        refreshToken = res.body.refreshToken;
    });

    it('should logout the user', async () => {
        const res = await chai.request(app)
        .post('/logout')
        .send({ sessionToken, refreshToken })

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Logged out successfully');

        const decodedSession = jwt.verify(sessionToken, process.env.JWT_SECRET);
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const sessionTokenExists = await redisClient.get(`sessionToken:${decodedSession.userId}`);
        const refreshTokenExists = await redisClient.get(`refreshToken:${decodedRefresh.userId}`);
        expect(sessionTokenExists).to.be.null;
        expect(refreshTokenExists).to.be.null;
    });

    it('should not allow logging out with invalid tokens', async () => {
        const res = await chai.request(app)
        .post('/logout')
        .send({ sessionToken: 'invalidToken', refreshToken: 'invalidToken' })

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Error logging out');
    });
});
