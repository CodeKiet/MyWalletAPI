const expect = require('expect');

const { generateResponse } = require('./response');

describe('generateResponse', () => {
    it('should generate correct response object', () => {
        let status = 200;
        let error = '';
        let body = {};
        let response = generateResponse(status, error, body);

        expect(response).toMatchObject({ status, error, body });
    });
});
