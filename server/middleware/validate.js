const { ObjectID } = require('mongodb');

const { generateResponse } = require('./../utils/response');

const validateId = async (req, res, next) => {
    let id = req.params.id;

    if (!ObjectID.isValid(id))
        return res.status(404).send(generateResponse(404, 'Invalid ID.'));

    next();
};

module.exports = { validateId };
