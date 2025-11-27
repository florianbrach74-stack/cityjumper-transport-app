const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const CMR = require('../models/CMR');
const CMRPdfGenerator = require('./cmrPdfGenerator');

class MultiStopPdfGenerator {
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
