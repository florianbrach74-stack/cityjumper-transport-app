const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');
const { sendEmail } = require('../config/email');
const path = require('path');
const fs = require('fs').promises;

// Contractor submits verification documents
const submitVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { insuranceDocumentUrl, businessLicenseUrl, minimumWageSignature } = req.body;

    if (!insuranceDocumentUrl || !businessLicenseUrl || !minimumWageSignature) {
      return res.status(400).json({ 
        error: 'Alle Dokumente und die Unterschrift sind erforderlich' 
      });
    }

    // Update user with verification documents
    const query = `
      UPDATE users 
      SET 
        insurance_document_url = $1,
        business_license_url = $2,
        minimum_wage_declaration_signed = TRUE,
        minimum_wage_signature = $3,
        minimum_wage_signed_at = CURRENT_TIMESTAMP,
        verification_status = 'pending'
      WHERE id = $4
      RETURNING *
    `;

    const result = await require('../config/database').query(query, [
      insuranceDocumentUrl,
      businessLicenseUrl,
      minimumWageSignature,
      userId
    ]);

    // Also save documents to verification_documents table for permanent storage
    try {
      // Save insurance document
      if (insuranceDocumentUrl) {
        await VerificationDocument.create({
          userId,
          documentType: 'insurance',
          fileName: 'Versicherungsnachweis',
          filePath: insuranceDocumentUrl,
          fileSize: null,
          mimeType: 'application/pdf',
          uploadedBy: userId
        });
      }

      // Save business license
      if (businessLicenseUrl) {
        await VerificationDocument.create({
          userId,
          documentType: 'business_license',
          fileName: 'Gewerbeschein',
          filePath: businessLicenseUrl,
          fileSize: null,
          mimeType: 'application/pdf',
          uploadedBy: userId
        });
      }

      // Save minimum wage signature
      if (minimumWageSignature) {
        await VerificationDocument.create({
          userId,
          documentType: 'minimum_wage_signature',
          fileName: 'Mindestlohn-Unterschrift',
          filePath: minimumWageSignature,
          fileSize: null,
          mimeType: 'image/png',
          uploadedBy: userId
        });
      }

      console.log(`✅ Verification documents saved to permanent storage for user ${userId}`);
    } catch (docError) {
      console.error('⚠️ Error saving to verification_documents table (non-critical):', docError.message);
      // Don't fail the verification submission if this fails
    }

    // Notify admins (optional - don't fail if email fails)
    try {
      // Get all admin users from database directly
      const { pool } = require('../config/database');
      const adminResult = await pool.query("SELECT * FROM users WHERE role = 'admin'");
      const admins = adminResult.rows;
      for (const admin of admins) {
        await sendEmail(
          admin.email,
          '🔔 Neue Verifizierungsanfrage',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Neue Verifizierungsanfrage</h2>
              <p>Ein Auftragnehmer hat Dokumente zur Verifizierung eingereicht.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Unternehmen:</strong> ${result.rows[0].company_name || result.rows[0].first_name + ' ' + result.rows[0].last_name}</p>
                <p><strong>Email:</strong> ${result.rows[0].email}</p>
              </div>
              
              <p>Bitte prüfen Sie die Dokumente im Admin-Dashboard.</p>
            </div>
          `
        );
      }
    } catch (emailError) {
      console.error('⚠️ Email notification failed (non-critical):', emailError.message);
    }

    res.json({
      message: 'Verifizierung eingereicht',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Submit verification error:', error);
    res.status(500).json({ 
      error: 'Fehler beim Einreichen der Verifizierung',
      details: error.message 
    });
  }
};

// Admin approves contractor
const approveContractor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    const query = `
      UPDATE users 
      SET 
        verification_status = 'approved',
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP,
        verification_notes = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await require('../config/database').query(query, [
      req.user.id,
      notes || null,
      userId
    ]);

    const contractor = result.rows[0];

    // Send approval email (optional)
    try {
      await sendEmail(
        contractor.email,
        '✅ Verifizierung erfolgreich',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Glückwunsch! Ihr Account wurde verifiziert</h2>
            <p>Hallo ${contractor.first_name} ${contractor.last_name},</p>
            <p>Ihre Dokumente wurden geprüft und Ihr Account wurde freigegeben.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 0;"><strong>Sie können sich jetzt auf Aufträge bewerben!</strong></p>
            </div>
            
            <p>Vielen Dank für Ihre Geduld.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('⚠️ Email notification failed (non-critical):', emailError.message);
    }

    res.json({
      message: 'Auftragnehmer freigegeben',
      user: contractor
    });
  } catch (error) {
    console.error('❌ Approve contractor error:', error);
    res.status(500).json({ error: 'Fehler beim Freigeben des Auftragnehmers' });
  }
};

// Admin rejects contractor
const rejectContractor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const query = `
      UPDATE users 
      SET 
        verification_status = 'rejected',
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP,
        verification_notes = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await require('../config/database').query(query, [
      req.user.id,
      reason || 'Dokumente unvollständig oder fehlerhaft',
      userId
    ]);

    const contractor = result.rows[0];

    // Send rejection email (optional)
    try {
      await sendEmail(
        contractor.email,
        '❌ Verifizierung abgelehnt',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Verifizierung abgelehnt</h2>
            <p>Hallo ${contractor.first_name} ${contractor.last_name},</p>
            <p>Leider konnten wir Ihre Dokumente nicht akzeptieren.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0;"><strong>Grund:</strong></p>
              <p>${reason || 'Dokumente unvollständig oder fehlerhaft'}</p>
            </div>
            
            <p>Bitte laden Sie die korrekten Dokumente erneut hoch.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('⚠️ Email notification failed (non-critical):', emailError.message);
    }

    res.json({
      message: 'Auftragnehmer abgelehnt',
      user: contractor
    });
  } catch (error) {
    console.error('❌ Reject contractor error:', error);
    res.status(500).json({ error: 'Fehler beim Ablehnen des Auftragnehmers' });
  }
};

// Get verification status
const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      verificationStatus: user.verification_status,
      insuranceDocumentUrl: user.insurance_document_url,
      businessLicenseUrl: user.business_license_url,
      minimumWageDeclarationSigned: user.minimum_wage_declaration_signed,
      verifiedAt: user.verified_at,
      verificationNotes: user.verification_notes
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Verifizierungsstatus' });
  }
};

// Get contractor documents (admin only)
const getContractorDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const documents = await VerificationDocument.getCurrentDocuments(userId);
    const user = await User.findById(userId);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        first_name: user.first_name,
        last_name: user.last_name,
        verification_status: user.verification_status,
        verified_at: user.verified_at
      },
      documents
    });
  } catch (error) {
    console.error('Get contractor documents error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Dokumente' });
  }
};

// Get all contractors with documents (admin only)
const getAllContractorsWithDocuments = async (req, res) => {
  try {
    const contractors = await VerificationDocument.getAllContractorsWithDocuments();
    res.json({ contractors });
  } catch (error) {
    console.error('Get all contractors error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Auftragnehmer' });
  }
};

// Download a verification document (admin only)
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await VerificationDocument.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }
    
    // Check if file exists
    const filePath = path.join(__dirname, '..', document.file_path);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Datei nicht gefunden auf dem Server' });
    }
    
    // Send file
    res.download(filePath, document.file_name);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Fehler beim Herunterladen des Dokuments' });
  }
};

module.exports = {
  submitVerification,
  approveContractor,
  rejectContractor,
  getVerificationStatus,
  getContractorDocuments,
  getAllContractorsWithDocuments,
  downloadDocument
};
