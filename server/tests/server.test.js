const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcryptjs');

const { app } = require('./../server');
const { User } = require('./../models/user');
const { Wallet } = require('./../models/wallet');
const { Transaction } = require('./../models/transaction');
const { 
    _baseUsers,
    _baseWallets,
    _baseTransactions,
    populateUsers, 
    populateWallets, 
    populateTransactions 
} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateWallets);
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

describe('POST /wallets', () => {
    it('should create a new wallet', done => {
        let name = 'Bank X';
        let balance = 2000;

        request(app)
            .post('/wallets')
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
                
                Wallet.find({ _creator: _baseUsers[0]._id }).then(wallets => {
                    expect(wallets.length).toBe(2);
                    expect(wallets[1]._id.toHexString()).toBe(res.body.body._id);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not create wallet with invalid body data', done => {
        request(app)
            .post('/wallets')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(400)
            .end(err => {
                if (err)
                    return done(err);

                Wallet.find().then(wallets => {
                    expect(wallets.length).toBe(_baseWallets.length);
                    done();
                }).catch(e => done(e));
            });
    });
});

describe('GET /wallets', () => {
    it('should get all wallets from first user', done => {
        request(app)
            .get('/wallets')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body.length).toBe(1))
            .end(done);
    });
});

describe('GET /wallets/:id', () => {
    it('should return wallet doc', done => {
        request(app)
            .get(`/wallets/${_baseWallets[0]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(_baseWallets[0]._id.toHexString()))
            .end(done);
    });

    it('should not return wallet doc created by other user', done => {
        request(app)
            .get(`/wallets/${_baseWallets[1]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if wallet not found', done => {
        request(app)
            .get(`/wallets/${new ObjectID()}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object ids', done => {
        request(app)
            .get('/wallets/123')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /wallets/:id', () => {
    it('should update the wallet name', done => {
        let hexId = _baseWallets[0]._id.toHexString();
        let body = { name: 'Some name' };

        request(app)
            .patch(`/wallets/${hexId}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send(body)
            .expect(200)
            .expect(res => {
                expect(res.body.body._id).toBe(hexId);
                expect(res.body.body.name).toBe(body.name);
            }).end(done);
    });

    it('should not update the wallet created by other user', done => {
        let hexId = _baseWallets[1]._id.toHexString();
        let body = { name: 'Some name' };

        request(app)
            .patch(`/wallets/${hexId}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .send(body)
            .expect(404)
            .end(done);
    });

    it('should return 404 if wallet not found', done => {
        request(app)
            .patch(`/wallets/${new ObjectID()}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object ids', done => {
        request(app)
            .patch('/wallets/123')
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /wallets/:id', () => {
    it('should remove an wallet', done => {
        let hexId = _baseWallets[1]._id.toHexString();

        request(app)
            .delete(`/wallets/${hexId}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(hexId))
            .end(err => {
                if (err)
                    return done(err);

                Wallet.findById(hexId).then(wallet => {
                    expect(wallet).toBeFalsy();
                    done();
                }).catch(e => done(e));
            });
    });

    it('should remove all transactions related to wallet', done => {
        let hexId = _baseWallets[1]._id.toHexString();

        request(app)
            .delete(`/wallets/${hexId}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(hexId))
            .end(err => {
                if (err)
                    return done(err);

                Transaction.find({ _wallet: _baseWallets[1]._id }).then(transactions => {
                    expect(transactions.length).toBe(0);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not remove an wallet created by other user', done => {
        let hexId = _baseWallets[0]._id.toHexString();

        request(app)
            .delete(`/wallets/${hexId}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(404)
            .end(err => {
                if (err)
                    return done(err);

                Wallet.findById(hexId).then(wallet => {
                    expect(wallet).toBeTruthy();
                    done();
                }).catch(e => done(e));
            });
    });

    it('should return 404 if wallet not found', done => {
        request(app)
            .delete(`/wallets/${new ObjectID()}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object ids', done => {
        request(app)
            .delete('/wallets/123')
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
            _wallet: _baseWallets[0]._id.toHexString()
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
                    let wallet = await Wallet.findById({ _id: body._wallet });
                    let newBalance = _baseWallets[0].balance + _baseTransactions[0].value + body.value;

                    expect(transactions.length).toBe(3);
                    expect(wallet.balance).toBe(newBalance);
                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('should not create transaction with invalid body data', done => {
        let body = {
            note: 'Some note',
            _wallet: _baseWallets[0]._id.toHexString()
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

    it('should not create transaction for other user', done => {
        let body = {
            note: 'Some note',
            value: 500,
            _wallet: _baseWallets[0]._id.toHexString()
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

describe('GET /transactions/:id', () => {
    it('should return transaction doc', done => {
        request(app)
            .get(`/transactions/${_baseTransactions[0]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(_baseTransactions[0]._id.toHexString()))
            .end(done);
    });

    it('should not return transaction doc created by other user', done => {
        request(app)
            .get(`/transactions/${_baseTransactions[1]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if transaction not found', done => {
        request(app)
            .get(`/transactions/${new ObjectID()}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('GET /transactions/wallets/:id', () => {
    it('should return transactions from first wallet', done => {
        request(app)
            .get(`/transactions/wallets/${_baseWallets[0]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body.length).toBe(1))
            .end(done);
    });

    it('should not return transactions from other user wallet', done => {
        request(app)
            .get(`/transactions/wallets/${_baseWallets[1]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if wallet not found', done => {
        request(app)
            .get(`/transactions/wallets/${new ObjectID()}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /transactions/:id', () => {
    it('should delete a transaction', done => {
        request(app)
            .delete(`/transactions/${_baseTransactions[0]._id}`)
            .set('x-auth', _baseUsers[0].tokens[0].token)
            .expect(200)
            .expect(res => expect(res.body.body._id).toBe(_baseTransactions[0]._id.toHexString()))
            .end(err => {
                if (err)
                    return done(err);

                Transaction.find({ _creator: _baseUsers[0]._id }).then(transactions => {
                    expect(transactions.length).toBe(0);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not delete a transaction from other user', done => {
        request(app)
            .delete(`/transactions/${_baseTransactions[0]._id}`)
            .set('x-auth', _baseUsers[1].tokens[0].token)
            .expect(400)
            .end(err => {
                if (err)
                    return done(err);

                Transaction.find({ _creator: _baseUsers[0]._id }).then(transactions => {
                    expect(transactions.length).toBe(1);
                    done();
                }).catch(e => done(e));
            });
    });
});
