const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
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

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = { Wallet };