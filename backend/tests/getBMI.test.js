#!/usr/bin/env node

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const User = require('../models/User');
const BMIvalue = require('../models/bmiModel');
const { DatabaseError } = require('sequelize');
const { expect } = chai;

chai.use(chaiHttp);

describe('GET /bmi/history', async() => {
    let sessionToken;
    let user;

    before(async () => {
        // Create a mock user
        user = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            fullname: faker.person.fullName(),
            username: faker.internet.userName(),
            age: faker.number.int({ min: 18, max: 65 }),
            gender: faker.person.sexType(),
            country: faker.location.country(),
            preferredLanguage: faker.word.noun(),
            height: faker.number.int({ min: 150, max: 200 }),
            weight: faker.number.int({ min: 50, max: 100 }),
        };

        await chai.request(app).post('/signup').send(user);

        const res = await chai.request(app)
            .post('/login')
            .send({ email: user.email, password: user.password });

        sessionToken = res.body.sessionToken;
    });

    afterEach(() => {
        sinon.restore();
    });

    after(async() => {
        sinon.restore();
        await BMIvalue.sequelize.sync({ force: true });
        await User.sequelize.sync({ force: true });
    });

    const makeRequest = async (data) => {
        return chai.request(app)
        .get('/bmi/history')
        .set('Authorization', `Bearer ${sessionToken}`)
        .query(data)
    };

    const calculateBMI = async () => {
        return chai.request(app)
        .post('/bmi/calculate')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
            height: faker.number.int({ min: 150, max: 200 }),
            weight: faker.number.int({ min: 50, max: 150 }),
            unit: 'imperial'
        });
    }

    it('should return paginated BMI history for a valid user', async() => {
        for (let i = 0; i < 5; i++) {
            await calculateBMI();
        }

        const res = await makeRequest({ page: 1, limit: 10 });
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('total');
        expect(res.body).to.have.property('currentPage').eql('1');
        expect(res.body).to.have.property('totalPages');
        expect(res.body).to.have.property('data').that.is.an('array');
        expect(res.body.data).to.have.length.at.least(5);
    });

    it('should return a 200 status for a valid user without any BMI record', async() => {
        const newUser = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            fullname: faker.person.fullName(),
            username: faker.internet.userName(),
            age: faker.number.int({ min: 18, max: 65 }),
            gender: faker.person.sexType(),
            country: faker.location.country(),
            preferredLanguage: faker.word.noun(),
            height: faker.number.int({ min: 150, max: 200 }),
            weight: faker.number.int({ min: 50, max: 100 }),
        };
    
        await chai.request(app).post('/signup').send(newUser);
    
        const loginRes = await chai.request(app)
            .post('/login')
            .send({ email: newUser.email, password: newUser.password });
    
        const newSessionToken = loginRes.body.sessionToken;
    
        const res = await chai.request(app)
        .get('/bmi/history')
        .set('Authorization', `Bearer ${newSessionToken}`)
        .query({ page: 1, limit: 5 });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql(`No BMI records found for user ${newUser.fullname}.`);
        expect(res.body.data).to.be.an('array').that.is.empty;
    });
    
    describe('validation errors', async() => {
        it('should return 404 Error when the user is not found', async() => {
            sinon.stub(User, 'findOne').resolves(null);

            const res = await makeRequest({ page: 1, limit: 5 });
            expect(res).to.have.status(404);
            expect(res.body).to.have.property('message').eql('User not found');
        });
    });

    describe('Error handling', async() => {
        it('should return 500 Error when there\'s an instance of DatabaseError', async() => {
            sinon.stub(BMIvalue, 'findAndCountAll').throws(new DatabaseError(new Error('Database Error')));

            const res = await makeRequest({ page: 1, limit: 5 });
            expect(res).to.have.status(500);
            expect(res.body).to.have.property('message').eql('Database Error');
        });

        it('should return 500 Error when there\'s an unknown error during execution', async() => {
            sinon.stub(BMIvalue, 'findAndCountAll').throws(new Error('Unknown Error'));

            const res = await makeRequest({ page: 1, limit: 5});
            expect(res).to.have.status(500);
            expect(res.body).to.have.property('message').eql('An error occurred while retrieving BMI records');
        });
    });

});