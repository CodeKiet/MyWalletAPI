const { User } = require('./../models/user');
const { generateResponse } = require('./../utils/response');

const authenticate = async (req, res, next) => {
    let token = req.header('x-auth');

    try {
        let user = await User.findByToken(token);
    
        if (!user)
            throw new Error();

        req.user = user;
        req.token = token;
        next();   
    } catch (error) {
        res.status(401).send(generateResponse(401, 'The request could not be authenticated.'));
    }
};

module.exports = { authenticate };
