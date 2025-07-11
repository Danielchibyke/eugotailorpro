import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/multerMiddleware.js';

const router = express.Router();

router.post('/image', protect, upload.single('image'), (req, res, next) => {
    req.setTimeout(120000); // Set timeout to 120 seconds (2 minutes)
    next();
}, uploadImage);

export default router;