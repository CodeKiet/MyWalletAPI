const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcryptjs');

const { app } = require('./../server');
const { User } = require('./../models/user');
const { Account } = require('./../models/account');
const { Transaction } = require('./../models/transaction');
const { 
    _baseUsers,
    _baseAccounts,
    _baseTransactions,
    populateUsers, 
    populateAccounts, 
    populateTransactions 
} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateAccounts);
beforeEach(populateTransactions);

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
                expect(res.body.body._id).toBeTruthy();
                expect(res.body.body.email).toBe(email);
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

describe('POST /users/login', () => {
    it('should login user and return auth token', done => {
        request(app)
            .post('/users/login')
            .send({ email: _baseUsers[0].email, password: _baseUsers[0].password })
            .expect(200)
            .expect(res => expect(res.headers['x-auth']).toBeTruthy())
            .end((err, res) => {
                if (err)
                    return done(err);

                User.findById(_baseUsers[0]._id).then(user => {
                    expect(user.tokens[1]).toMatchObject({
                        access: 'auth',
                        token: res.headers['x-auth']
                    });
                    done();
                }).catch(e => done(e));
            });
    });

    it('should reject invalid login', done => {
        request(app)
            .post('/users/login')
            .send({ email: _baseUsers[1].email, password: 'someInvalidPassword' })
            .expect(400)
            .expect(res => expect(res.headers['x-auth']).toBeFalsy())
            .end(err => {
                if (err)
                    return done(err);

                User.findById(_baseUsers[1]._id).then(user => {
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch(e => done(e));
            });
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', done => {
        request(app)
            .get('/users/me')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => {
                expect(res.body.body._id).toBe(_baseUsers[0]._id.toHexString());
                expect(res.body.body.email).toBe(_baseUsers[0].email);
            })
            .end(done);
    });

    it('should return 401 if not authenticated', done => {
        request(app)
            .get('/users/me')
            .expect(401)
            .end(done);
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', done => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err)
                    return done(err);

                User.findById(_baseUsers[0]._id).then(user => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch(e => done(e));
            });
    });
});

describe('POST /accounts', () => {
    it('should create a new account', done => {
        let name = 'Bank X';
        let balance = 2000;

        request(app)
            .post('/accounts')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send({ name, balance })
            .expect(200)
            .expect(res => {
                expect(res.body.body.name).toBe(name);
                expect(res.body.body.balance).toBe(balance)
            })
            .end((err, res) => {
                if (err)
                    return done(err);
                
                Account.find({ _creator: _baseUsers[0]._id }).then(accounts => {
                    expect(accounts.length).toBe(2);
                    expect(accounts[1]._id.toHexString()).toBe(res.body.body._id);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not create account with invalid body data', done => {
        request(app)
            .post('/accounts')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(400)
            .end(err => {
                if (err)
                    return done(err);

                Account.find().then(accounts => {
                    expect(accounts.length).toBe(_baseAccounts.length);
                    done();
                }).catch(e => done(e));
            });
    });
});

describe('GET /accounts', () => {
    it('should get all accounts from first user', done => {
        request(app)
            .get('/accounts')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body.length).toBe(1))
            .end(done);
    });
});

describe('GET /accounts/:id', () => {
    it('should return account doc', done => {
        request(app)
            .get(`/accounts/${_baseAccounts[0]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(_baseAccounts[0]._id.toHexString()))
            .end(done);
    });

    it('should not return account doc created by other user', done => {
        request(app)
            .get(`/accounts/${_baseAccounts[1]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if todo not found', done => {
        request(app)
            .get(`/accounts/${new ObjectID()}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object ids', done => {
        request(app)
            .get('/accounts/123')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /accounts/:id', () => {
    it('should update the account name', done => {
        let hexId = _baseAccounts[0]._id.toHexString();
        let body = { name: 'Some name' };

        request(app)
            .patch(`/accounts/${hexId}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send(body)
            .expect(200)
            .expect(res => {
                expect(res.body.body._id).toBe(hexId);
                expect(res.body.body.name).toBe(body.name);
            }).end(done);
    });

    it('should not update the account created by other user', done => {
        let hexId = _baseAccounts[1]._id.toHexString();
        let body = { name: 'Some name' };

        request(app)
            .patch(`/accounts/${hexId}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send(body)
            .expect(404)
            .end(done);
    });

    it('should return 404 if account not found', done => {
        request(app)
            .patch(`/accounts/${new ObjectID()}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object ids', done => {
        request(app)
            .patch('/accounts/123')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /accounts/:id', () => {
    it('should remove an account', done => {
        let hexId = _baseAccounts[1]._id.toHexString();

        request(app)
            .delete(`/accounts/${hexId}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(hexId))
            .end(err => {
                if (err)
                    return done(err);

                Account.findById(hexId).then(account => {
                    expect(account).toBeFalsy();
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not remove an account created by other user', done => {
        let hexId = _baseAccounts[0]._id.toHexString();

        request(app)
            .delete(`/accounts/${hexId}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(404)
            .end(err => {
                if (err)
                    return done(err);

                Account.findById(hexId).then(account => {
                    expect(account).toBeTruthy();
                    done();
                }).catch(e => done(e));
            });
    });

    it('should return 404 if account not found', done => {
        request(app)
            .delete(`/accounts/${new ObjectID()}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object ids', done => {
        request(app)
            .delete('/accounts/123')
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('POST /transactions', () => {
    it('should create a transaction', done => {
        let body = {
            note: 'Some note',
            value: 500,
            _account: _baseAccounts[0]._id.toHexString()
        };

        request(app)
            .post('/transactions')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send(body)
            .expect(200)
            .expect(res => expect(res.body.body).toBeTruthy())
            .end(async err => {
                if (err)
                    return done(err);

                try {
                    let transactions = await Transaction.find();
                    let account = await Account.findById({ _id: body._account });
                    let newBalance = _baseAccounts[0].balance + _baseTransactions[0].value + body.value;

                    expect(transactions.length).toBe(3);
                    expect(account.balance).toBe(newBalance);
                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('should not create transaction with invalid body data', done => {
        let body = {
            note: 'Some note',
            _account: _baseAccounts[0]._id.toHexString()
        };
        
        request(app)
            .post('/transactions')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send(body)
            .expect(400)
            .expect(res => expect(res.body.body).toBeFalsy())
            .end(async err => {
                if (err)
                    return done(err);

                Transaction.find().then(transactions => {
                    expect(transactions.length).toBe(2);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not created transaction for other user', done => {
        let body = {
            note: 'Some note',
            value: 500,
            _account: _baseAccounts[0]._id.toHexString()
        };

        request(app)
            .post('/transactions')
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .send(body)
            .expect(400)
            .end(async err => {
                if (err)
                    return done(err);

                Transaction.find().then(transactions => {
                    expect(transactions.length).toBe(2);
                    done();
                }).catch(e => done(e));
            });
    });
});

describe('GET /transactions', () => {
    it('should get all transactions', done => {
        request(app)
            .get('/transactions')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body.length).toBe(1))
            .end(done);
    });
});
