const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const User = require('../models/User');
const { expect } = chai;

chai.use(chaiHttp);

describe('POST /profile', () => {
    let sessionToken;
    let refreshToken;
    let user;

    before( async() => {
        // Create a mock user
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
        refreshToken = res.body.refreshToken;
    });

    afterEach(() => {
        sinon.restore();
    });

    after( async() => {
        sinon.restore();
        await User.sequelize.sync({ force: true });
    });

    it('should successfully update the full profile', async() => {
        const data = {
            fullname: faker.person.fullName(),
            username: faker.internet.userName(),
            age: faker.number.int({ min: 18, max: 65 }),
            gender: faker.person.sexType(),
            country: faker.location.country(),
            preferredLanguage: faker.word.noun(),
            height: faker.number.int({ min: 150, max: 200}),
            weight: faker.number.int({ min: 50, max: 100}) 
        }

        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(data)

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('Profile updated successfully');
        expect(res.body.user).to.include(data);
        expect(res.body.user).to.have.property('last_updated_at');
        expect(res.body.user).to.have.property('created_at');
    });

    it('should partially update the profile (update only gender and country)', async() =>{
        const data = {
            gender: faker.person.sexType(),
            country: faker.location.country()
        }
        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(data)

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').eql('Profile updated successfully');
        expect(res.body.user).to.include(data);
        expect(res.body.user).to.have.property('last_updated_at');
        expect(res.body.user).to.have.property('created_at');
    });

    it('should return a 400 error when the fullname is not a string', async() => {
        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
            fullname: faker.number.int({ min: 0, max: 500 })
        })

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('Fullname must be a string');
    });

    it('should return a 400 when height is not a float', async() => {
        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({ 
            height: faker.word.noun() 
        })

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('Height must be a valid float number');
    });

    it('should return a 404 error when the user is not found', async() => {
        sinon.stub(User, 'findOne').resolves(null);

        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({ 
            fullname: faker.person.fullName() 
        })

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message').eql('User not found');
        
        sinon.restore();
    });

    it('should return 400 when the token isn\'t the token stored as user\'s session token', async() => {
        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({
            age: faker.number.int({ min: 18, max: 65 }),
            gender: faker.person.sexType(),
            country: faker.location.country(),
            preferredLanguage: faker.word.noun(),
            height: faker.number.int({ min: 150, max: 200})
        })

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message').eql('User\'s session token is invalid');
    });

    it('should return 500 for internal server error caused by unknown source', async() => {
        sinon.stub(User, 'findOne').throws(new Error('Unknown Error'));

        const res = await chai.request(app)
        .post('/profile')
        .set('Authorization', `Bearer ${sessionToken}`)

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('message').eql('User\'s details cannot be updated at the moment');

        sinon.restore();
    });
});