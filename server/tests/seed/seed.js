const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('./../../models/user');
const { Account } = require('./../../models/account');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const _baseUsers = [{
    _id: userOneId,
    email: 'daniel@example.com',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: userOneId, access: 'auth' }, process.env.JWT_SECRET).toString()
    }]
}, {
    _id: userTwoId,
    email: 'luiza@example.com',
    password: 'userTwoPass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: userTwoId, access: 'auth' }, process.env.JWT_SECRET).toString()
    }]
}];

const _baseAccounts = [{
    _id: new ObjectID(),
    name: 'Bank 1',
    balance: 1000,
    _creator: userOneId
}, {
    _id: new ObjectID(),
    name: 'Bank 2',
    balance: 500,
    _creator: userTwoId
}];

const populateUsers = done => {
    User.deleteMany({}).then(() => {
        let userOne = new User(_baseUsers[0]).save();
        let userTwo = new User(_baseUsers[1]).save();

        return Promise.all([userOne, userTwo]);
    }).then(() => done());
};

const populateAccounts = done => {
    Account.deleteMany({}).then(() => {
        let accountOne = new Account(_baseAccounts[0]).save();
        let accountTwo = new Account(_baseAccounts[1]).save();

        return Promise.all([accountOne, accountTwo]);
    }).then(() => done());
};

module.exports = { _baseUsers, _baseAccounts, populateUsers, populateAccounts };
