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
import notificationRoutes from './routes/notificationRoutes.js';
import designRoutes from './routes/designRoutes.js';
import startReminderScheduler from './utils/reminderScheduler.js'; 



dotenv.config();
connectDB();
startReminderScheduler();


const app = express();
'http://localhost:5173', 'exp://172.20.10.2:8081'

// middlewares
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.MOBILE_URL,
  'http://localhost:5173', // Default for client
  'exp://172.20.10.3:8081',
  'exp://172.20.10.2:8081',
  'http://localhost:8081',
  'http://localhost:8082',
  'exp+mobile://expo-development-client/?url=http%3A%2F%2F172.20.10.2%3A8081'
].filter(Boolean);

app.use(cors({
     origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
   }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/api/notifications', notificationRoutes); // Use notification routes
app.use('/api/designs', designRoutes); // Use design routes


const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});