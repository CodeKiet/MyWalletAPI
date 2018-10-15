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

    if (transaction.isNew) {
        wallet.balance += transaction.value;
        await Wallet.findOneAndUpdate({ _id: wallet._id }, { $set: wallet });
    } else if (transaction.isModified('value')) {
        // ...
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
