const _ = require('lodash');
const mongoose = require('mongoose');

const { Wallet } = require('./wallet');

const TransactionSchema = new mongoose.Schema({
    note: {
        type: String,
        trim: true
    },
    value: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Number
    },
    _wallet: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

TransactionSchema.pre('save', async function(next) {
    let transaction = this;
    transaction.timestamp = new Date().getTime();
    
    let wallet = await Wallet.findById(transaction._wallet);
    wallet.balance += transaction.value;
    
    await Wallet.findOneAndUpdate({ _id: wallet._id }, { $set: wallet });
    
    next();
});

TransactionSchema.pre('findOneAndUpdate', async function(next) {
    let query = this.getQuery();
    let id = query._id;
    let creator = query._creator;
    let newValue = this.getUpdate()['$set'].value;

    if (_.isNumber(newValue)) {
        let transaction = await Transaction.findById(id);

        if (creator.equals(transaction._creator)) {
            let wallet = await Wallet.findById(transaction._wallet);

            wallet.balance = wallet.balance - transaction.value + newValue;
            await Wallet.findOneAndUpdate({ _id: wallet._id }, { $set: wallet });
        }
    }
    
    next();
});

TransactionSchema.post('findOneAndDelete', async function (transaction) {
    let wallet = await Wallet.findById(transaction._wallet);
    wallet.balance -= transaction.value;
    await Wallet.findOneAndUpdate({ _id: wallet._id }, { $set: wallet });
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Transaction };
