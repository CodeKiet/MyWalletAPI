require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json())



app.listen(port, () => console.log(`Server is up on port ${port}.`));

module.exports = { app };
