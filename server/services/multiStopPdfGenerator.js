const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const CMR = require('../models/CMR');
const CMRPdfGenerator = require('./cmrPdfGenerator');

class MultiStopPdfGenerator {
  /**
   * Generate combined PDF for multi-stop order
   * Format: CMR #1 → Photo #1 → CMR #2 → Photo #2 → ...
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

      // Create combined PDF
      const uploadsDir = path.join(__dirname, '../../uploads/cmr');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `cmr_combined_${orderId}_${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        autoFirstPage: false
      });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add title page
      doc.addPage();
      doc.fontSize(24).text('Multi-Stop CMR Dokumente', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Auftrag #${orderId}`, { align: 'center' });
      doc.fontSize(12).text(`${cmrs.length} Zustellungen`, { align: 'center' });
      doc.moveDown(2);
      
      // Add summary with route
      doc.fontSize(12).text('Zustellreihenfolge:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('gray').text('Bitte in dieser Reihenfolge abarbeiten:', { indent: 20 });
      doc.moveDown(0.5);
      doc.fillColor('black');
      
      cmrs.forEach((cmr, index) => {
        const isLast = index === cmrs.length - 1;
        doc.fontSize(11).fillColor('blue').text(
          `${index + 1}. Zustellung`,
          { indent: 20, underline: true }
        );
        doc.fontSize(10).fillColor('black').text(
          `   ${cmr.consignee_name}`,
          { indent: 30 }
        );
        doc.fontSize(9).text(
          `   ${cmr.consignee_address}, ${cmr.consignee_postal_code} ${cmr.consignee_city}`,
          { indent: 30 }
        );
        if (!isLast) {
          doc.fontSize(9).fillColor('gray').text('   ↓', { indent: 30 });
        }
        doc.moveDown(0.3);
      });
      doc.fillColor('black');

      // Add each CMR + Photo
      for (let i = 0; i < cmrs.length; i++) {
        const cmr = cmrs[i];
        console.log(`   Adding CMR ${i + 1}/${cmrs.length}: ${cmr.cmr_number}`);

        // Add page break
        doc.addPage();

        // Add CMR header
        doc.fontSize(16).text(`CMR ${i + 1}/${cmrs.length}`, { align: 'center' });
        doc.fontSize(12).text(`CMR-Nummer: ${cmr.cmr_number}`, { align: 'center' });
        doc.moveDown(2);

        // Add CMR details
        this.addCMRDetails(doc, cmr);

        // Add photo if exists
        const photo = cmr.delivery_photo_base64 || cmr.shared_delivery_photo_base64;
        if (photo) {
          console.log(`   Adding photo for CMR ${cmr.cmr_number}`);
          doc.addPage();
          doc.fontSize(14).text(`Zustellfoto - ${cmr.consignee_name}`, { align: 'center' });
          doc.moveDown();
          
          try {
            // Convert base64 to buffer
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            // Add image (fit to page width with margin)
            doc.image(imageBuffer, {
              fit: [doc.page.width - 100, doc.page.height - 200],
              align: 'center'
            });
          } catch (err) {
            console.error('Error adding photo:', err);
            doc.text('Foto konnte nicht geladen werden', { align: 'center' });
          }
        }
      }

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      console.log(`✅ Combined PDF generated: ${filename}`);

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
   * Add CMR details to PDF
   */
  static addCMRDetails(doc, cmr) {
    const startY = doc.y;

    // Sender
    doc.fontSize(11).text('Absender:', { underline: true });
    doc.fontSize(9).text(cmr.sender_name);
    doc.text(`${cmr.sender_address}`);
    doc.text(`${cmr.sender_postal_code} ${cmr.sender_city}, ${cmr.sender_country}`);
    doc.moveDown();

    // Receiver
    doc.fontSize(11).text('Empfänger:', { underline: true });
    doc.fontSize(9).text(cmr.consignee_name);
    doc.text(`${cmr.consignee_address}`);
    doc.text(`${cmr.consignee_postal_code} ${cmr.consignee_city}, ${cmr.consignee_country}`);
    doc.moveDown();

    // Carrier
    doc.fontSize(11).text('Frachtführer:', { underline: true });
    doc.fontSize(9).text(cmr.carrier_name);
    if (cmr.carrier_address) {
      doc.text(`${cmr.carrier_address}`);
      doc.text(`${cmr.carrier_postal_code} ${cmr.carrier_city}`);
      doc.text('Deutschland');
    }
    doc.moveDown();

    // Goods
    doc.fontSize(11).text('Fracht:', { underline: true });
    doc.fontSize(9).text(`Beschreibung: ${cmr.goods_description || 'N/A'}`);
    doc.text(`Anzahl: ${cmr.number_of_packages || 'N/A'}`);
    doc.text(`Gewicht: ${cmr.gross_weight ? cmr.gross_weight + ' kg' : 'N/A'}`);
    doc.moveDown();

    // Signatures Section
    doc.fontSize(11).text('Unterschriften:', { underline: true });
    doc.moveDown(0.5);
    
    // Empfänger Info nochmal anzeigen (wichtig für Unterschrift!)
    doc.fontSize(10).fillColor('blue').text('Zustellung an:', { underline: true });
    doc.fontSize(9).fillColor('black').text(cmr.consignee_name);
    doc.text(`${cmr.consignee_address}`);
    doc.text(`${cmr.consignee_postal_code} ${cmr.consignee_city}`);
    doc.moveDown(0.5);
    
    // Sender signature
    doc.fillColor('black');
    if (cmr.sender_signature || cmr.shared_sender_signature) {
      doc.fontSize(9).text('✓ Absender unterschrieben', { fillColor: 'green' });
    } else {
      doc.fontSize(9).text('⚠ Absender: Unterschrift fehlt', { fillColor: 'red' });
    }
    
    // Carrier signature
    if (cmr.carrier_signature || cmr.shared_carrier_signature) {
      doc.fontSize(9).text('✓ Frachtführer unterschrieben', { fillColor: 'green' });
    } else {
      doc.fontSize(9).text('⚠ Frachtführer: Unterschrift fehlt', { fillColor: 'red' });
    }
    
    // Receiver signature
    if (cmr.consignee_signature || cmr.shared_receiver_signature) {
      doc.fontSize(9).text('✓ Empfänger unterschrieben', { fillColor: 'green' });
    } else if (cmr.delivery_photo_base64 || cmr.shared_delivery_photo_base64) {
      doc.fontSize(9).text('📷 Empfänger nicht angetroffen (Foto vorhanden)', { fillColor: 'orange' });
    } else {
      doc.fontSize(9).text('⚠ Empfänger: Unterschrift fehlt', { fillColor: 'red' });
    }
    
    doc.fillColor('black');

    doc.moveDown();

    // Special agreements
    if (cmr.special_agreements) {
      doc.fontSize(11).text('Besondere Vereinbarungen:', { underline: true });
      doc.fontSize(8).text(cmr.special_agreements, { width: doc.page.width - 100 });
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
      
      // TODO: Send email to customer with PDF attachment
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
