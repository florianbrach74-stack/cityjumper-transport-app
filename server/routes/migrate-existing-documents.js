const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const VerificationDocument = require('../models/VerificationDocument');
const cloudinary = require('../config/cloudinary');

// Migrate existing verification documents to permanent storage (Admin only, one-time use)
router.post('/migrate-existing-documents', async (req, res) => {
  try {
    console.log('🚀 Migrating existing verification documents...');
    
    // Get all contractors with verification documents
    const result = await pool.query(`
      SELECT id, insurance_document_url, business_license_url, minimum_wage_signature
      FROM users
      WHERE role = 'contractor' 
      AND (insurance_document_url IS NOT NULL 
           OR business_license_url IS NOT NULL 
           OR minimum_wage_signature IS NOT NULL)
    `);
    
    const users = result.rows;
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Migrate insurance document
        if (user.insurance_document_url) {
          let cloudinaryUrl = user.insurance_document_url;
          
          // If it's base64, upload to Cloudinary
          if (user.insurance_document_url.startsWith('data:')) {
            console.log(`📤 Uploading insurance document for user ${user.id} to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(user.insurance_document_url, {
              folder: 'verification-documents',
              resource_type: 'auto'
            });
            cloudinaryUrl = uploadResult.secure_url;
          }
          
          await VerificationDocument.create({
            userId: user.id,
            documentType: 'insurance',
            fileName: 'Versicherungsnachweis',
            filePath: cloudinaryUrl,
            fileSize: null,
            mimeType: 'application/pdf',
            uploadedBy: user.id
          });
          migratedCount++;
        }
        
        // Migrate business license
        if (user.business_license_url) {
          let cloudinaryUrl = user.business_license_url;
          
          // If it's base64, upload to Cloudinary
          if (user.business_license_url.startsWith('data:')) {
            console.log(`📤 Uploading business license for user ${user.id} to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(user.business_license_url, {
              folder: 'verification-documents',
              resource_type: 'auto'
            });
            cloudinaryUrl = uploadResult.secure_url;
          }
          
          await VerificationDocument.create({
            userId: user.id,
            documentType: 'business_license',
            fileName: 'Gewerbeschein',
            filePath: cloudinaryUrl,
            fileSize: null,
            mimeType: 'application/pdf',
            uploadedBy: user.id
          });
          migratedCount++;
        }
        
        // Migrate minimum wage signature
        if (user.minimum_wage_signature) {
          let cloudinaryUrl = user.minimum_wage_signature;
          
          // If it's base64, upload to Cloudinary
          if (user.minimum_wage_signature.startsWith('data:')) {
            console.log(`📤 Uploading signature for user ${user.id} to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(user.minimum_wage_signature, {
              folder: 'verification-documents',
              resource_type: 'auto'
            });
            cloudinaryUrl = uploadResult.secure_url;
          }
          
          await VerificationDocument.create({
            userId: user.id,
            documentType: 'minimum_wage_signature',
            fileName: 'Mindestlohn-Unterschrift',
            filePath: cloudinaryUrl,
            fileSize: null,
            mimeType: 'image/png',
            uploadedBy: user.id
          });
          migratedCount++;
        }
        
        console.log(`✅ Migrated documents for user ${user.id}`);
      } catch (userError) {
        console.error(`⚠️ Error migrating user ${user.id}:`, userError.message);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: 'Migration completed!',
      usersProcessed: users.length,
      documentsMigrated: migratedCount,
      errors: errorCount
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
