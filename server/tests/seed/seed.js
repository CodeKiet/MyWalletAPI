const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('./../../models/user');
const { Account } = require('./../../models/account');
const { Transaction } = require('./../../models/transaction');

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

const _baseTransactions = [{
    _id: new ObjectID(),
    note: 'Some note',
    value: 100,
    timestamp: new Date().getTime(),
    _account: _baseAccounts[0]._id,
    _creator: _baseAccounts[0]._creator
}, {
    _id: new ObjectID(),
    note: 'Another note',
    value: 500,
    timestamp: new Date().getTime(),
    _account: _baseAccounts[1]._id,
    _creator: _baseAccounts[1]._creator
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

const populateTransactions = done => {
    Transaction.deleteMany({}).then(() => {
        let transactionOne = new Transaction(_baseTransactions[0]).save();
        let transactionTwo = new Transaction(_baseTransactions[1]).save();

        return Promise.all([transactionOne, transactionTwo]);
    }).then(() => done());
};

module.exports = { 
    _baseUsers, 
    _baseAccounts, 
    _baseTransactions, 
    populateUsers,
    populateAccounts, 
    populateTransactions 
};
