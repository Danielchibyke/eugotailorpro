// server/models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema(
    {
        client: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Client',
        },
        type: { // e.g., 'Sale', 'Refund', 'Payment'
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'NGN', 
        },
        description: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        // Reference to the user (staff/admin) who recorded this transaction
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;