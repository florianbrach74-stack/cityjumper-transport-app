const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');

router.get('/test-cloudinary', async (req, res) => {
  try {
    console.log('🧪 Testing Cloudinary configuration...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY);
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT SET');
    
    // Try a simple upload test with a small base64 image
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(testImage, {
      folder: 'test'
    });
    
    res.json({
      success: true,
      message: 'Cloudinary is working!',
      url: result.secure_url
    });
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.error || {}
    });
  }
});

module.exports = router;
