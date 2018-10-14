const { User } = require('./../models/user');

const authenticate = async (req, res, next) => {
    let token = req.header('x-auth');

    try {
        let user = await User.findByToken(token);
    
        if (!user)
            return Promise.reject();

        req.user = user;
        req.token = token;
        next();   
    } catch (error) {
        res.status(401).send();
    }
};

module.exports = { authenticate };
