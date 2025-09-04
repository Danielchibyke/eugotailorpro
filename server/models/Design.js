// server/models/Design.js
import mongoose from 'mongoose';

const designSchema = mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true,
        },
        // You can add more fields here later, like a name, description, or tags
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Design = mongoose.model('Design', designSchema);

export default Design;
