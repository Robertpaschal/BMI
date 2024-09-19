#!/usr/bin/env node

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
const { faker }= require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const AuthController = require('../controllers/authController');
const User = require('../models/User');
const { emailQueue } = require('../utils/emailQueue');

chai.use(chaiHttp);

describe('Password Reset Endpoints', () => {
    let emailQueueStub;
    let findUserStub;
    let bcryptCompareStub;
    let mockUser;
    let validToken;
    let invalidToken

    before(() => {
        // Stub the User model to mock finding a user by email
        findUserStub = sinon.stub(User, 'findOne');
        // Create a valid and invalid token for testing
        validToken = 'valid-token';
        invalidToken = 'invalid-token';
        // Stubbing jwt.sign for the valid token test
        sinon.stub(jwt, 'sign').callsFake(() => validToken);
        // Mock user object
        mockUser = { id: 1, email: faker.internet.email({ firstName: 'Any'}), password: bcrypt.hashSync('oldPassword', 10) };
        mockUser.save = sinon.stub().resolves(mockUser);
        emailAdd = { email: mockUser.email, token: validToken };
        // Stub emailQueue to mock background email sending process
        emailQueueStub = sinon.stub(emailQueue, 'add');

    });

    after(() => {
        sinon.restore();
    });

    describe('POST /request-password-reset', () => {
        it('should request a password reset and send an email if the user exists', async () => {
            findUserStub.resolves(mockUser);

            const res = await chai.request(app)
            .post('/request-password-reset')
            .send({ email: mockUser.email })

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message').eql(`Password reset email sent to ${mockUser.email}`);
        });

        it('should return 404 when user is not found', async () => {
            findUserStub.resolves(null);

            const res = await chai.request(app)
            .post('/request-password-reset')
            .send({ email: faker.internet.email({ firstname: 'any'}) })

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('message').eql('Invalid email, user not found');
        });

        it('should return 400 if email is missing', async() => {
            const res = await chai.request(app)
            .post('/request-password-reset')
            .send({})

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('A valid email address is required');
        });

        it('should return 500 if sending email fails', async () => {
            findUserStub.resolves(mockUser);
            emailQueueStub.rejects(new Error('Error sending password reset email'));

            const res = await chai.request(app)
            .post('/request-password-reset')
            .send({ email: mockUser.email })

            expect(res).to.have.status(500);
            expect(res.body).to.have.property('error').eql('Error sending password reset email');
        });
    })

    describe('GET /reset-password', () => {
        it('should render the password reset form with a valid token', async () => {
            findUserStub.resolves(mockUser);
            emailQueueStub.resolves(emailAdd);
        
            const res = await chai.request(app)
            .get(`/reset-password?token=${validToken}`)

            expect(res).to.have.status(200);
            expect(res.text).to.include('<form');

            sinon.restore();
        });

        it('should return 400 if token is missing', async () => {
            const res = await chai.request(app)
            .get('/reset-password')

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Token is missing');
        });
    });

    describe('POST /reset-password', () => {
        beforeEach(() => {
            // Stub bcrypt.compare to simulate password comparison
            bcryptCompareStub = sinon.stub(bcrypt, 'compare');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should reset the password with a valid token', async () => {
            bcryptCompareStub.resolves(false);

            // Stub jwt.verify to simulate token decoding
            sinon.stub(jwt, 'verify').callsFake((token) => {
                try{
                    if (token === validToken) {
                        return { userId: mockUser.id };
                    }
                    throw new Error
                } catch (error) {
                    return error;
                }
            });
            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: validToken, newPassword: faker.internet.password() })

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message').eql('Password has been successfully reset');

        });

        it('should return 400 if token is invalid', async () => {
            bcryptCompareStub.resolves(false);

            sinon.stub(jwt, 'verify').throws({ name: 'JsonWebTokenError' });

            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: invalidToken, newPassword: faker.internet.password() })

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Invalid token');

        });

        it('should return 400 if the token is expired', async () => {
            sinon.stub(jwt, 'verify').throws({ name: 'TokenExpiredError' });

            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: validToken, newPassword: faker.internet.password() });

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Invalid or expired token');
        });

        it('should return 400 if the token has been tampered with', async () => {
            bcryptCompareStub.resolves(false);
            sinon.stub(jwt, 'verify').throws(new Error('invalid token'));

            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: 'tampared-token', newPassword: faker.internet.password() });

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Invalid or expired token');
        });

        it('should return 400 if new password is missing', async () => {
            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: validToken })

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').eql('Token and new password are required');

        });

        it('should return 404 if new password is the same as the old password', async () => {
            bcryptCompareStub.resolves(true);
            sinon.stub(jwt, 'verify').callsFake((token) => {
                try{
                    if (token === validToken) {
                        return { userId: mockUser.id };
                    }
                    throw new Error('Invalid token')
                } catch (error) {
                    return error;
                }
            });

            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: validToken, newPassword: faker.internet.password() })

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('message').eql('New password cannot be the same as old password');

        });

        it('should return 500 if there is a server error during password reset', async () => {
            sinon.stub(User.prototype, 'save').rejects(new Error('DatabaseError'));

            sinon.stub(jwt, 'verify').callsFake((token) => {
                try{
                    if (token === validToken) {
                        return { userId: mockUser.id };
                    }
                    throw new Error('Invalid token')
                } catch (error) {
                    return error;
                }
            });
            const res = await chai.request(app)
            .post('/reset-password')
            .send({ token: validToken, newPassword: faker.internet.password() })

            expect(res).to.have.status(500);
            expect(res.body).to.have.property('message').eql('Internal server error');

            sinon.restore();
        });
    });
});
