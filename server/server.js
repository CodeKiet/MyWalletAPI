require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { User } = require('./models/user');
const { Account } = require('./models/account');
const { authenticate } = require('./middleware/authenticate');
const { generateResponse } = require('./utils/response');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json())

//#region  Users
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
    let body = _.pick(req.body, ['email', 'password']);

    try {
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
//#endregion

//#region Accounts
app.post('/accounts', authenticate, async (req, res) => {
    try {
        let account = await new Account({
            name: req.body.name,
            balance: req.body.balance,
            _creator: req.user._id
        }).save();
        res.send(generateResponse(200, '', account));
    } catch (error) {
        res.status(400).send(generateResponse(400, error.message));
    }
});
//#endregion

app.listen(port, () => console.log(`Server is up on port ${port}.`));

module.exports = { app };
