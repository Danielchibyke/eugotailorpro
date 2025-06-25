// server/routes/clientRoutes.js
import express from 'express';
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
} from '../controllers/clientController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('admin', 'staff'), createClient) // Only authorized users can create
    .get(protect, authorizeRoles('admin', 'staff'), getClients); // Only authorized users can view all

router.route('/:id')
    .get(protect, authorizeRoles('admin', 'staff'), getClientById)
    .put(protect, authorizeRoles('admin', 'staff'), updateClient)
    .delete(protect, authorizeRoles('admin'), deleteClient); // Only admin can delete for stricter control

export default router;