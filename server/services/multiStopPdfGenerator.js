const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const CMR = require('../models/CMR');
const CMRPdfGenerator = require('./cmrPdfGenerator');

class MultiStopPdfGenerator {
  /**
   * Transfer signatures between CMRs based on multi-stop scenario
   * Scenario 1: 1 Sender → Multiple Receivers (transfer sender + carrier signatures)
   * Scenario 2: Multiple Senders → 1 Receiver (transfer carrier + receiver signatures)
   * Scenario 3: Multiple Senders → Multiple Receivers (transfer carrier signature only)
   */
  static transferSignatures(cmrs) {
    if (!cmrs || cmrs.length <= 1) return;

    console.log('🔄 Transferring signatures between CMRs...');

    // Check scenario by comparing sender and consignee addresses
    const firstCmr = cmrs[0];
    const senderAddresses = new Set(cmrs.map(c => `${c.sender_address}-${c.sender_city}`));
    const consigneeAddresses = new Set(cmrs.map(c => `${c.consignee_address}-${c.consignee_city}`));

    const isSameSender = senderAddresses.size === 1;
    const isSameConsignee = consigneeAddresses.size === 1;

    console.log(`   Scenario: ${isSameSender ? '1 Sender' : 'Multiple Senders'} → ${isSameConsignee ? '1 Receiver' : 'Multiple Receivers'}`);

    // Always transfer carrier signature (Frachtführer) from first CMR to all others
    const carrierSignature = firstCmr.carrier_signature;
    const carrierSignedBy = firstCmr.carrier_signed_by;
    const carrierSignedAt = firstCmr.carrier_signed_at;

    // Scenario 1: 1 Sender → Multiple Receivers
    if (isSameSender && !isSameConsignee) {
      console.log('   → Transferring sender + carrier signatures');
      const senderSignature = firstCmr.sender_signature;
      const senderSignedAt = firstCmr.sender_signed_at;

      cmrs.forEach((cmr, index) => {
        if (index > 0) {
          cmr.sender_signature = senderSignature;
          cmr.sender_signed_at = senderSignedAt;
          cmr.carrier_signature = carrierSignature;
          cmr.carrier_signed_by = carrierSignedBy;
          cmr.carrier_signed_at = carrierSignedAt;
        }
      });
    }
    // Scenario 2: Multiple Senders → 1 Receiver
    else if (!isSameSender && isSameConsignee) {
      console.log('   → Transferring carrier + receiver signatures');
      const consigneeSignature = firstCmr.consignee_signature;
      const consigneeSignedName = firstCmr.consignee_signed_name;
      const consigneeSignedAt = firstCmr.consignee_signed_at;
      const consigneePhoto = firstCmr.consignee_photo;

      cmrs.forEach((cmr, index) => {
        if (index > 0) {
          cmr.carrier_signature = carrierSignature;
          cmr.carrier_signed_by = carrierSignedBy;
          cmr.carrier_signed_at = carrierSignedAt;
          cmr.consignee_signature = consigneeSignature;
          cmr.consignee_signed_name = consigneeSignedName;
          cmr.consignee_signed_at = consigneeSignedAt;
          cmr.consignee_photo = consigneePhoto;
        }
      });
    }
    // Scenario 3: Multiple Senders → Multiple Receivers
    else {
      console.log('   → Transferring carrier signature only');
      cmrs.forEach((cmr, index) => {
        if (index > 0) {
          cmr.carrier_signature = carrierSignature;
          cmr.carrier_signed_by = carrierSignedBy;
          cmr.carrier_signed_at = carrierSignedAt;
        }
      });
    }

    console.log('✅ Signature transfer complete');
  }

  /**
   * Generate combined PDF for multi-stop order
   * Uses the REAL CMR format from cmrPdfGenerator for each stop
   */
  static async generateCombinedPDF(orderId, cmrGroupId) {
    try {
      console.log(`📄 Generating combined PDF for order ${orderId}`);
      
      // Get all CMRs for this group
      const cmrs = await CMR.findByGroupId(cmrGroupId);
      
      if (!cmrs || cmrs.length === 0) {
        throw new Error('No CMRs found for this order');
      }

      console.log(`   Found ${cmrs.length} CMR(s)`);

      // Sort by delivery_stop_index
      cmrs.sort((a, b) => a.delivery_stop_index - b.delivery_stop_index);

      // Create uploads directory
      const uploadsDir = path.join(__dirname, '../../uploads/cmr');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate individual CMR PDFs first using the REAL CMR format
      const Order = require('../models/Order');
      const order = await Order.findById(orderId);
      
      // Transfer signatures based on multi-stop scenario
      this.transferSignatures(cmrs);
      
      const individualPdfs = [];
      for (let i = 0; i < cmrs.length; i++) {
        const cmr = cmrs[i];
        console.log(`   Generating CMR ${i + 1}/${cmrs.length}: ${cmr.cmr_number}`);
        
        // Generate individual CMR using the REAL CMR format
        const cmrFilepath = await CMRPdfGenerator.generateCMR(cmr, order);
        individualPdfs.push(cmrFilepath);
      }

      // Merge all PDFs into one
      console.log(`   Merging ${individualPdfs.length} PDFs...`);
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfPath of individualPdfs) {
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // Save merged PDF
      const filename = `cmr_combined_${orderId}_${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      const mergedPdfBytes = await mergedPdf.save();
      fs.writeFileSync(filepath, mergedPdfBytes);
      
      console.log(`✅ Combined PDF generated: ${filename}`);

      // Clean up individual PDFs
      for (const pdfPath of individualPdfs) {
        try {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }
        } catch (err) {
          console.warn(`Could not delete temporary PDF: ${pdfPath}`);
        }
      }

      return {
        filepath,
        filename
      };
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and send combined PDF to customer
   */
  static async generateAndSendCombinedPDF(orderId) {
    try {
      const cmrGroupId = `ORDER-${orderId}`;
      
      // Generate PDF
      const { filepath, filename } = await this.generateCombinedPDF(orderId, cmrGroupId);
      
      console.log(`📧 TODO: Send combined PDF to customer`);
      console.log(`   File: ${filename}`);
      
      return {
        success: true,
        filename,
        filepath
      };
    } catch (error) {
      console.error('Error generating and sending combined PDF:', error);
      throw error;
    }
  }
}

module.exports = MultiStopPdfGenerator;
