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
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize(PERMISSIONS.CLIENTS_CREATE), createClient) // Only authorized users can create
    .get(protect, authorize(PERMISSIONS.CLIENTS_VIEW), getClients); // Only authorized users can view all

router.route('/:id')
    .get(protect, authorize(PERMISSIONS.CLIENTS_VIEW), getClientById)
    .put(protect, authorize(PERMISSIONS.CLIENTS_EDIT), updateClient)
    .delete(protect, authorize(PERMISSIONS.CLIENTS_DELETE), deleteClient); // Only admin can delete for stricter control

router.route('/:id/measurements')
    .put(protect, authorize(PERMISSIONS.CLIENTS_EDIT), updateClientMeasurements); // New route for updating measurements

export default router;