
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // Deprecated, but often included
            useUnifiedTopology: true, // Deprecated, but often included
            // Removed useCreateIndex and useFindAndModify as they are no longer supported
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB;