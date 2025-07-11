import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  // Validate file type and size
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'Invalid file type' });
  }
  if (req.file.size > 70 * 1024 * 1024) {
    return res.status(400).json({ message: 'File too large (max 10MB)' });
  }

  try {
    // Stream-based upload (better for large files)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'eugotailorpro',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error.response?.body || error);
          return res.status(500).json({ message: 'Upload failed' });
        }
        res.status(200).json({ imageUrl: result.secure_url });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { uploadImage };