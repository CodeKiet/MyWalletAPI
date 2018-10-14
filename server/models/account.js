const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    balance: {
        type: Number,
        required: true
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

const Account = mongoose.model('Account', AccountSchema);

module.exports = { Account };