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

describe('POST /bmi/calculate', () => {
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

    after(() => {
        sinon.restore();
    });

    const makeRequest = async (data) => {
        return chai.request(app)
            .post('/bmi/calculate')
            .set('Authorization', `Bearer ${sessionToken}`)
            .send(data);
    };

    it('should calculate the BMI value of a valid user', async () => {
        let res = await makeRequest({
            height: faker.number.int({ min: 1, max: 200 }),
            weight: faker.number.int({ min: 1, max: 200 }),
            unit: 'imperial',
        });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('bmi');
        expect(res.body).to.have.property('category');

        res = await makeRequest({
            height: faker.number.int({ min: 1, max: 200 }),
            weight: faker.number.int({ min: 1, max: 200 }),
            unit: 'metric',
        });

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('bmi');
        expect(res.body).to.have.property('category');
    });

    describe('Validation Errors', () => {
        it('should return 404 Error when user is not found', async () => {
            sinon.stub(User, 'findOne').resolves(null);

            const res = await makeRequest({
                height: faker.number.int({ min: 1, max: 200 }),
                weight: faker.number.int({ min: 1, max: 200 }),
                unit: 'metric',
            });

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('message').eql('User not found');
        });

        it('should return 400 Error when required input data is missing', async () => {
            const res = await makeRequest({
                height: faker.number.int({ min: 1, max: 200 }),
            });

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Incomplete input data');
        });

        it('should return 400 Error when the unit field value is not metric or imperial', async () => {
            const res = await makeRequest({
                height: faker.number.int({ min: 1, max: 200 }),
                weight: faker.number.int({ min: 1, max: 200 }),
                unit: 'invalid-unit',
            });

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Unit field should have value of metric or imperial');
        });

        it('should return 400 Error when height or weight is not a float', async () => {
            const res = await makeRequest({
                height: faker.internet.password(),
                weight: faker.word.noun(),
                unit: 'metric',
            });

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Height and weight must be a valid float number');
        });
    });

    describe('Error Handling', () => {
        it('should return 500 Error when there\'s an instance of Sequelize database error', async () => {
            sinon.stub(BMIvalue, 'create').throws(new DatabaseError(new Error('DatabaseError')));

            const res = await makeRequest({
                height: faker.number.int({ min: 1, max: 200 }),
                weight: faker.number.int({ min: 1, max: 200 }),
                unit: 'metric',
            });

            expect(res).to.have.status(500);
            expect(res.body).to.have.property('message').eql('Database Error');
        });

        it('should return 500 Error when there\'s an unknown error', async () => {
            sinon.stub(BMIvalue, 'create').throws(new Error('Unknown Error'));

            const res = await makeRequest({
                height: faker.number.int({ min: 1, max: 200 }),
                weight: faker.number.int({ min: 1, max: 200 }),
                unit: 'metric',
            });

            expect(res).to.have.status(500);
            expect(res.body).to.have.property('message').eql('Internal server error');
        });
    });
});
