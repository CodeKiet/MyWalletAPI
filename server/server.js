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
    let user = new User(_.pick(req.body, ['email', 'password']));

    user.save()
        .then(() => user.generateAuthToken())
        .then(token => res.header('x-auth', token).send(user))
        .catch(e => res.status(400).send(e));
});

app.listen(port, () => console.log(`Server is up on port ${port}.`));

module.exports = { app };
