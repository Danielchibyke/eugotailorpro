import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';       
import bookingRoutes from './routes/bookingRoutes.js';    
import financialRoutes from './routes/financialRoutes.js'; 
import balanceRoutes from './routes/balanceRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import startReminderScheduler from './utils/reminderScheduler.js'; 



dotenv.config();
connectDB();
startReminderScheduler();


const app = express();
'http://localhost:5173', 'exp://172.20.10.2:8081'

// middlewares
app.use(cors(
  {
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173',  'exp://172.20.10.3:8081', 'exp://172.20.10.2:8081','http://localhost:8081', 'http://localhost:8082', '*'],// Adjust this to your frontend URL
    
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    
  }

));
app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

app.get('/', (req, res) => {
  res.send('API is running...');
});
//API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);         // Use client routes
app.use('/api/bookings', bookingRoutes);       // Use booking routes
app.use('/api/transactions', financialRoutes); // Use financial routes
app.use('/api/balances', balanceRoutes); // Use balance routes
app.use('/api/upload', uploadRoutes); // Use upload routes


const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});