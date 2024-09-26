#!/usr/bin/env node

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const User = require('../models/User');
const { DatabaseError } = require('sequelize');
const { expect } = chai;

chai.use(chaiHttp);

describe('DELETE /Profile', async() => {
    let user;
    let sessionToken;
    let findUser;

    beforeEach(async() => {
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

        sessionToken  = res.body.sessionToken;

        const createdUser = await User.findOne({ where: { email: user.email } });
        user.id = createdUser.id;
    });

    afterEach(() => {
        sinon.restore();
    });

    after(async () => {
        sinon.restore();
        await User.sequelize.sync({ force: true });
    });

    it('should successfully delete a user\'s profile and account', async() => {
        const res = await chai.request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('User profile and account deleted successfully');
        
        const deletedUser = await User.findOne({ where: { id: user.id }})
        expect(deletedUser).to.be.null;
    });

    it('should return 500 when destroying the user runs an error', async() => {
        const userStub = {
            destroy: sinon.stub().throws(new Error('Undestructible')),
        };
        sinon.stub(User, 'findOne').resolves(userStub);

        const res = await chai.request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message').eql("User's account cannot be deleted at the moment");
    });

    it('should return 500 when the error is an instance of DatabaseError', async() => {
        const userStub = {
            destroy: sinon.stub().throws(new DatabaseError(new Error('cannot destroy'))),
        };
        sinon.stub(User, 'findOne').resolves(userStub);

        const res = await chai.request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message').eql('Error connecting to the database');
    });

    it('should return 500 when an unexpected error occurs while trying to delete a user', async() =>{
        const userStub = {
            destroy: sinon.stub().throws(new Error('User not found'))
        };
        sinon.stub(User, 'findOne').resolves(userStub);
        const res = await chai.request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message').eql('User\'s account cannot be deleted at the moment')
    });

    it('should return 404 when the user cannot be found', async() => {
        sinon.stub(User, 'findOne').resolves(null);

        const res = await chai.request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message').eql('User not found'); 
    });

});
