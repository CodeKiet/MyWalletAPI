const mongoose = require('mongoose');

const { Account } = require('./account');

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
        type: Number,
        required: true
    },
    _account: {
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
    let account = await Account.findById(transaction._account);

    if (transaction.isNew) {
        account.balance += transaction.value;
        await Account.findOneAndUpdate({ _id: account._id, _creator: transaction._creator }, { $set: account });
    } else if (transaction.isModified('value')) {
        // ...
    }

    next();
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Transaction };
