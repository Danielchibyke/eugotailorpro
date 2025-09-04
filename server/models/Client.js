// server/models/Client.js
import mongoose from 'mongoose';

const measurementSchema = mongoose.Schema({
    chest: { type: [Number] },
    waist: { type: Number },
    roundsleeve: { type: [Number] },
    shoulder: { type: Number },
    toplength: { type: Number },
    trouserlength: { type: Number },
    thigh: { type: Number },
    knee: { type: Number },
    ankle: { type: Number },
    neck: { type: Number },
    sleeveLength: { type: [Number] },
}, { _id: false });

const clientSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        address: {
            type: String,
        },
        notes: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        measurements: {
            type: measurementSchema,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const Client = mongoose.model('Client', clientSchema);

export default Client;