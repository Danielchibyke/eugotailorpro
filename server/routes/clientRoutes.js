// server/routes/clientRoutes.js
import express from 'express';
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
    updateClientMeasurements, // Import the new function
} from '../controllers/clientController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('admin', 'staff'), createClient) // Only authorized users can create
    .get(protect, authorizeRoles('admin', 'staff'), getClients); // Only authorized users can view all

router.route('/:id')
    .get(protect, authorizeRoles('admin', 'staff'), getClientById)
    .put(protect, authorizeRoles('admin', 'staff'), updateClient)
    .delete(protect, authorizeRoles('admin', 'staff'), deleteClient); // Only admin can delete for stricter control

router.route('/:id/measurements')
    .put(protect, authorizeRoles('admin', 'staff'), updateClientMeasurements); // New route for updating measurements

export default router;