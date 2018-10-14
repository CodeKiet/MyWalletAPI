const generateResponse = (status, error, body) => {
    return { status, error, body };
};

module.exports = { generateResponse };
