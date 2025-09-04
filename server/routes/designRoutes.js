// server/routes/designRoutes.js
import express from 'express';
import { createDesign, getDesigns, deleteDesign } from '../controllers/designController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createDesign)
    .get(protect, getDesigns);

router.route('/:id')
    .delete(protect, deleteDesign);

export default router;
