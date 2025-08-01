// server/models/Client.js
import mongoose from 'mongoose';

const clientSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true, // Clients can have unique emails
            sparse: true, // Allows null values, so email is not strictly required but if present, must be unique
        },
        phone: {
            type: String,
            required: true,
            unique: true, // Phone numbers should be unique
        },
        address: {
            type: String,
        },
        notes: { // Any specific client notes or preferences
            type: String,
        },
        // Reference to the user (staff/admin) who created this client record
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        measurement: {
            chest: {
                type: [Number],
                default: [0, 0],
            },
            waist: {
                type: Number,
                default: 0,
            },
            roundsleeve: {
                type: [Number],
                default: [0, 0, 0],
            },
            shoulder: {
                type: Number,
                default: 0,
            },
            toplength: {
                type: Number,
                default: 0,
            },
            trouserlength: {
                type: Number,
                default: 0,
            },
            thigh: {
                type: Number,
                default: 0,
            },
            knee: {
                type: Number,
                default: 0,
            },
            ankle: {
                type: Number,
                default: 0,
            },
            neck: {
                type: Number,
                default: 0,
            },
            sleeveLength: {
                type: [Number],
                default: [0, 0, 0],
            },
        }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

const Client = mongoose.model('Client', clientSchema);

export default Client;