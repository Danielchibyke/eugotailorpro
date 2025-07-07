import mongoose from 'mongoose';

const balanceRecordSchema = mongoose.Schema(
    {
        lastBalancedDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        cashBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        bankBalance: {
            type: Number,
            required: true,
            default: 0,
        },
        recordedBy: { // User who performed the balancing
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const BalanceRecord = mongoose.model('BalanceRecord', balanceRecordSchema);

export default BalanceRecord;