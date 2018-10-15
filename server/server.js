require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { User } = require('./models/user');
const { Wallet } = require('./models/wallet');
const { Transaction } = require('./models/transaction');
const { authenticate } = require('./middleware/authenticate');
const { validateId } = require('./middleware/validate');
const { generateResponse } = require('./utils/response');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json())

app.post('/users', async (req, res) => {
    try {
        let user = await new User(_.pick(req.body, ['email', 'password'])).save();
        let token = await user.generateAuthToken();
        res.header('x-auth', token).send(generateResponse(200, '', user));
    } catch (error) {
        let err = error.name === 'ValidationError' ? error.message : `${req.body.email} is already in use.`;
        res.status(400).send(generateResponse(400, err));
    }
});

app.post('/users/login', async (req, res) => {
    try {
        let body = _.pick(req.body, ['email', 'password']);
        let user = await User.findByCredentials(body.email, body.password);
        let token = await user.generateAuthToken();

        res.header('x-auth', token).send(generateResponse(200, '', user));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Invalid email and/or password.'));
    }
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(generateResponse(200, '', req.user));
});

app.delete('/users/me/token', authenticate, async (req, res) => {
    try {
        await req.user.removeToken(req.token);
        res.status(200).send(generateResponse(200, ''));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Failed to delete token.'));
    }
});

app.post('/wallets', authenticate, async (req, res) => {
    try {
        let wallet = await new Wallet({
            name: req.body.name,
            balance: req.body.balance,
            _creator: req.user._id
        }).save();
        res.send(generateResponse(200, '', wallet));
    } catch (error) {
        res.status(400).send(generateResponse(400, error.message));
    }
});

app.get('/wallets', authenticate, async (req, res) => {
    try {
        let wallets = await Wallet.find({ _creator: req.user._id });
        res.send(generateResponse(200, '', wallets));
    } catch (error) {
        res.status(generateResponse(400, '', error));
    }
});

app.get('/wallets/:id', authenticate, validateId, async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ _id: req.params.id, _creator: req.user._id });

        if (!wallet)
            return res.status(404).send(generateResponse(404, 'Wallet not found.'));
        
        res.send(generateResponse(200, '', wallet));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Bad request.', error));
    }
});

app.delete('/wallets/:id', authenticate, validateId, async (req, res) => {
    try {
        let id = req.params.id;
        let wallet = await Wallet.findOneAndDelete({ _id: id, _creator: req.user._id });

        if (_.isNull(wallet))
            return res.status(404).send(generateResponse(404, 'Wallet not found.'));

        await Transaction.deleteMany({ _wallet: id });
        res.send(generateResponse(200, '', wallet));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Bad request.', error));
    }
});

app.patch('/wallets/:id', authenticate, validateId, async (req, res) => {
    try {
        let body = _.pick(req.body, ['name']);
        let wallet = await Wallet.findOneAndUpdate({ _id: req.params.id, _creator: req.user.id }, { $set: body }, { new: true });

        if (_.isNull(wallet))
            return res.status(404).send(generateResponse(404, 'Wallet not found.'));
        
        res.send(generateResponse(200, '', wallet));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Bad request'));
    }
});

app.post('/transactions', authenticate, async (req, res) => {
    try {
        let body = _.pick(req.body, ['note', 'value', '_wallet']);
        body._creator = req.user._id;
        
        if (!await Wallet.isValidCreator(body._wallet, body._creator))
            throw new Error('Wallet not found.');            

        let transaction = await new Transaction(body).save();
        res.send(generateResponse(200, '', transaction));
    } catch (error) {
        res.status(400).send(generateResponse(400, error.message));
    }
});

app.get('/transactions', authenticate, async (req, res) => {
    try {
        let transactions = await Transaction.find({ _creator: req.user._id });
        res.send(generateResponse(200, '', transactions));
    } catch (error) {
        res.status(400, '', error);
    }
});

app.get('/transactions/:id', authenticate, validateId, async (req, res) => {    
    try {
        let id = req.params.id;
        let transaction = await Transaction.findOne({ _id: id, _creator: req.user._id });

        if (!transaction)
            return res.status(404).send(generateResponse(404, 'Transaction not found.'));
        
        res.send(generateResponse(200, '', transaction));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Bad request.', error));
    }
});

app.get('/transactions/wallets/:id', authenticate, validateId, async (req, res) => {
    try {
        let id = req.params.id;
        
        if (!await Wallet.isValidCreator(id, req.user._id)) 
            return res.status(404).send(generateResponse(404, 'Wallet not found.'));

        let transactions = await Transaction.find({ _creator: req.user._id, _wallet: id });        
        res.send(generateResponse(200, '', transactions));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Bad request.', error));
    }
});

app.delete('/transactions/:id', authenticate, async (req, res) => {
    try {
        let id = req.params.id;
        let transaction = await Transaction.findOneAndDelete({ _id: id, _creator: req.user._id });

        if (!transaction)
            return res.status(404).send(generateResponse(404, 'Transaction not found.'));

        res.send(generateResponse(200, '', transaction));
    } catch (error) {
        res.status(400).send(generateResponse(400, 'Bad request.', error));
    }
});

app.listen(port, () => console.log(`Server is up on port ${port}.`));

module.exports = { app };
