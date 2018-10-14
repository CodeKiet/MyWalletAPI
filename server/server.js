require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json())

app.post('/users', async (req, res) => {
    try {
        let user = await new User(_.pick(req.body, ['email', 'password'])).save();
        let token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch (error) {
        res.status(400).send(error);   
    }
});

app.post('/users/login', async (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);

    try {
        let user = await User.findByCredentials(body.email, body.password);
        let token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.listen(port, () => console.log(`Server is up on port ${port}.`));

module.exports = { app };
