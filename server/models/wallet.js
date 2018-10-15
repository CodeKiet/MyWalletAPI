const _ = require('lodash');
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

WalletSchema.statics.isValidCreator = async function(_id, _creator) {
    let Wallet = this;
    let wallets = await Wallet.find({ _id, _creator })
    return wallets.length > 0;
};

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = { Wallet };