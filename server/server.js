import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';       
import bookingRoutes from './routes/bookingRoutes.js';    
import financialRoutes from './routes/financialRoutes.js'; 



dotenv.config();
connectDB();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});
//API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);         // Use client routes
app.use('/api/bookings', bookingRoutes);       // Use booking routes
app.use('/api/transactions', financialRoutes); // Use financial routes


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});