// server/controllers/designController.js
import asyncHandler from 'express-async-handler';
import Design from '../models/Design.js';

// @desc    Create a new design
// @route   POST /api/designs
// @access  Private
const createDesign = asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
        res.status(400);
        throw new Error('Image URL is required');
    }

    const design = await Design.create({
        imageUrl,
        createdBy: req.user._id,
    });

    res.status(201).json(design);
});

// @desc    Get all designs
// @route   GET /api/designs
// @access  Private
const getDesigns = asyncHandler(async (req, res) => {
    const designs = await Design.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(designs);
});

// @desc    Delete a design
// @route   DELETE /api/designs/:id
// @access  Private
const deleteDesign = asyncHandler(async (req, res) => {
    const design = await Design.findById(req.params.id);

    if (design) {
        if (design.createdBy.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to delete this design');
        }
        await Design.deleteOne({ _id: design._id });
        res.json({ message: 'Design removed' });
    } else {
        res.status(404);
        throw new Error('Design not found');
    }
});

export { createDesign, getDesigns, deleteDesign };
