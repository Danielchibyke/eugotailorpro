
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: { 
            type: String,
            default: 'staff',
        },
    },
    {
        timestamps: true, 
    }
);

// --- Pre-save Hook to Hash Password ---
// This middleware runs before a user document is saved to the database.
// It checks if the password field has been modified (e.g., during registration or password change).
// If so, it hashes the password using bcrypt.
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next(); // If password is not modified, move to the next middleware/save operation
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10); // 10 is a good default for salt rounds
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Move to the next middleware/save operation
});

// --- Method to Compare Passwords ---
// This method will be available on user documents to compare a plain-text password
// provided during login with the hashed password stored in the database.
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- Method to Generate JWT Token ---
// This method will generate a JSON Web Token for the user upon successful login.
// The token contains the user's ID and is signed with a secret key.
userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

const User = mongoose.model('User', userSchema);

export default User;