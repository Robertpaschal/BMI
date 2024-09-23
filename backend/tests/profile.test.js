#!/usr/bin/env node

const chai = require('chai');
const chaiHttp = require('chai-http');
const { faker } = require('@faker-js/faker');
const sinon = require('sinon');
const { DatabaseError } = require('sequelize');
const app = require('../app');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { expect } = chai;

chai.use(chaiHttp);

describe('Tests the GET /profile endpoint', () => {
    let validToken;
    let invalidToken = 'invalidtoken';
    let user;

    before (async () => {
        user = {
            email: faker.internet.email({ firstname: 'Any'}),
            password: faker.internet.password(),
            fullname: faker.person.fullName(),
            username: faker.internet.userName(),
            age: faker.number.int({ min: 18, max: 65 }),
            gender: faker.person.sexType(),
            country: faker.location.country(),
            preferredLanguage: faker.word.noun(),
            height: faker.number.int({ min: 150, max: 200}),
            weight: faker.number.int({ min: 50, max: 100}),
        };

        await chai.request(app)
        .post('/signup')
        .send(user);

        const res = await chai.request(app)
        .post('/login')
        .send({
            email: user.email,
            password: user.password
        });

        validToken  = res.body.sessionToken;
    });
    afterEach(() => {
        sinon.restore();
    });
    after(async () => {
        sinon.restore();
        await User.sequelize.sync({ force: true });
    })

    it('should retrieve the user profile successfully with a valid token', async() => {
        const res = await chai.request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)

        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('fullname');
        expect(res.body).to.have.property('age');
        expect(res.body).to.have.property('gender');
        expect(res.body).to.have.property('country');
        expect(res.body).to.have.property('preferredLanguage');
        expect(res.body).to.have.property('height');
        expect(res.body).to.have.property('weight');
        expect(res.body).to.have.property('last_updated_at');
        expect(res.body).to.have.property('created_at');
    });

    it('should return 400 for unauthorized access without a token', async() => {
        const res = await chai.request(app)
        .get('/profile')
        
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('Authorization header is required');
    });

    it('should return 400 for invalid token', async() => {
        const res = await chai.request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${invalidToken}`)

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('Invalid token');
    });

    it('should return 400 for missing token', async() => {
        const res = await chai.request(app)
        .get('/profile')
        .set('Authorization', '')

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('Authorization header is required');
    });

    it('should return 400 for expired token', async() => {
        sinon.stub(jwt, 'verify').throws({ name: 'TokenExpiredError' });

        const res = await chai.request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('Expired token')
    });

    it('should return 500 for internal server error caused by the database', async() => {
        sinon.stub(User, 'findOne').throws(new DatabaseError(new Error('DatabaseError')));

        const res = await chai.request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message').eql('Connection to the database caanot be established');
        
        sinon.restore();
    });

    it('should return 500 for internal server error caused by unknown source', async() => {
        sinon.stub(User, 'findOne').throws(new Error('Unknown Error'));

        const res = await chai.request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message').eql('User\'s details cannot be fetched at the moment');

        sinon.restore();
    });
});
