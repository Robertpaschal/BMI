#!/usr/bin/env node

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app.js');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');

chai.use(chaiHttp);

const { compare, hash } = bcrypt
const { expect } = chai;

describe('POST /signup', () => {

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    it('should create a new user with valid details', async () => {
        const res = await chai.request(app)
        .post('/signup')
        .send({
            email: 'test@example.com',
            password: 'Test1234',
            fullname: 'Test User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message', 'User created successfully');
        expect(res.body.user).to.have.property('email', 'test@example.com');
        
        const user = await User.findOne({ where: { email: 'test@example.com' } });
        expect(user).to.not.be.null;
        expect(await compare('Test1234', user.password)).to.be.true;
    });

    it('should not create a user if email is missing', async () => {
        const res = await chai.request(app)
        .post('/signup')
        .send({
            password: 'Test1234',
            fullname: 'Test User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').that.contains('Email');
    });

    it('should not create a user if password is missing', async () => {
        const res = await chai.request(app)
        .post('/signup')
        .send({
            email: 'test@example.com',
            fullname: 'Test User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').that.contains('Password');
    });

    it('should not create a user if email already exists', async () => {
        await User.create({
            email: 'test@example.com',
            password: await hash('Test1234', 10),
            fullname: 'Test User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        const res = await chai.request(app)
        .post('/signup')
        .send({
            email: 'test@example.com',
            password: 'NewPass1234',
            fullname: 'Another User',
            username: 'anotheruser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Email is already in use.');
    });

    it('should not create a user if username already exists', async () => {
        await User.create({
            email: 'unique@example.com',
            password: await hash('Test1234', 10),
            fullname: 'Test User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        const res = await chai.request(app)
        .post('/signup')
        .send({
            email: 'new@example.com',
            password: 'NewPass1234',
            fullname: 'Another User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Username is already in use.');
    });

    it('should not create a user with an invalid email format', async () => {
        const res = await chai.request(app)
        .post('/signup')
        .send({
            email: 'invalid-email',
            password: 'Test1234',
            fullname: 'Test User',
            username: 'testuser',
            age: 25,
            gender: 'Male',
            country: 'Country',
            preferredLanguage: 'English',
            height: 170,
            weight: 70,
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').that.contains('Invalid email format');
    });
});