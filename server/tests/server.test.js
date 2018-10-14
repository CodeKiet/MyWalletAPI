const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcryptjs');

const { app } = require('./../server');
const { User } = require('./../models/user');
const { _baseUsers, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);

describe('POST /users', () => {
    it('should create a user', done => {
        let email = 'example@example.com';
        let password = 'somePassword';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(200)
            .expect(res => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBe(email);
            })
            .end(err => {
                if (err)
                    return done(err);

                User.findOne({ email }).then(async user => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password);
                    bcrypt.compare(password, user.password).then(res => expect(res).toBe(true));

                    done();
                }).catch(e => done(e));
            });
    });

    it('should return validation errors if request is invalid', done => {
        let email = 'example';
        let password = '12345';
        
        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .expect(res => {
                expect(res.body.name).toBe('ValidationError');
            })
            .end(err => {
                if (err)
                    return done(err);

                User.find().then(users => {
                    expect(users.length).toBe(_baseUsers.length);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not create user if email in use', done => {
        let email = _baseUsers[0].email;
        let password = 'somePassword';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .expect(res => {
                expect(res.body.code).toBe(11000);
            })
            .end(err => {
                if (err)
                    return done(err);

                User.find().then(users => {
                    expect(users.length).toBe(_baseUsers.length);
                    done();
                }).catch(e => done(e));
            });
    });
});
