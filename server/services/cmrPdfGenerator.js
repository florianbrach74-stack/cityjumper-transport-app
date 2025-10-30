const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class CMRPdfGenerator {
  static async generateCMR(cmrData, order) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../../uploads/cmr');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `CMR_${cmrData.cmr_number}.pdf`;
        const filepath = path.join(uploadsDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Frachtbrief/CMR', { align: 'right' });
        doc.fontSize(10).font('Helvetica').text('INTERNATIONALER FRACHTBRIEF', { align: 'right' });
        doc.fontSize(10).text('INTERNATIONAL CONSIGNMENT NOTE', { align: 'right' });
        doc.moveDown();

        // CMR Number and Date
        doc.fontSize(12).font('Helvetica-Bold').text(`CMR Nr: ${cmrData.cmr_number}`, 30, 100);
        doc.fontSize(10).font('Helvetica').text(`Datum: ${new Date(cmrData.created_at).toLocaleDateString('de-DE')}`, 30, 115);

        // Generate QR Code for tracking
        const qrCodeUrl = `${process.env.CLIENT_URL}/cmr/${cmrData.cmr_number}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, 480, 90, { width: 80 });

        doc.moveDown(3);

        // Box 1: Sender (Absender) - Show company name and/or contact person
        this.drawBox(doc, 30, 150, 260, 80);
        doc.fontSize(8).font('Helvetica-Bold').text('1. Absender (Name, Anschrift, Land)', 35, 155);
        let senderY = 170;
        doc.fontSize(9).font('Helvetica');
        if (order.pickup_company) {
          doc.text(order.pickup_company, 35, senderY);
          senderY += 13;
        }
        if (order.pickup_contact_name) {
          doc.fontSize(8).text(`Kontakt: ${order.pickup_contact_name}`, 35, senderY);
          senderY += 13;
        }
        doc.fontSize(9)
          .text(cmrData.sender_address, 35, senderY)
          .text(`${cmrData.sender_postal_code} ${cmrData.sender_city}`, 35, senderY + 13)
          .text(cmrData.sender_country, 35, senderY + 26);

        // Box 2: Consignee (Empfänger) - Show company name and/or contact person
        this.drawBox(doc, 30, 235, 260, 80);
        doc.fontSize(8).font('Helvetica-Bold').text('2. Empfänger (Name, Anschrift, Land)', 35, 240);
        let consigneeY = 255;
        doc.fontSize(9).font('Helvetica');
        if (order.delivery_company) {
          doc.text(order.delivery_company, 35, consigneeY);
          consigneeY += 13;
        }
        if (order.delivery_contact_name) {
          doc.fontSize(8).text(`Kontakt: ${order.delivery_contact_name}`, 35, consigneeY);
          consigneeY += 13;
        }
        doc.fontSize(9)
          .text(cmrData.consignee_address, 35, consigneeY)
          .text(`${cmrData.consignee_postal_code} ${cmrData.consignee_city}`, 35, consigneeY + 13)
          .text(cmrData.consignee_country, 35, consigneeY + 26);

        // Box 3: Place of Delivery
        this.drawBox(doc, 30, 320, 260, 40);
        doc.fontSize(8).font('Helvetica-Bold').text('3. Auslieferungsort (Ort, Land)', 35, 325);
        doc.fontSize(9).font('Helvetica').text(cmrData.place_of_delivery || cmrData.consignee_city, 35, 340);

        // Box 4: Place and Date of Loading
        this.drawBox(doc, 30, 365, 260, 40);
        doc.fontSize(8).font('Helvetica-Bold').text('4. Ort und Tag der Übernahme (Ort, Land, Datum)', 35, 370);
        doc.fontSize(9).font('Helvetica')
          .text(cmrData.place_of_loading || cmrData.sender_city, 35, 385)
          .text(new Date(order.pickup_date).toLocaleDateString('de-DE'), 35, 395);

        // Box 5: Documents Attached
        this.drawBox(doc, 30, 410, 260, 40);
        doc.fontSize(8).font('Helvetica-Bold').text('5. Beigefügte Dokumente', 35, 415);
        doc.fontSize(8).font('Helvetica').text(cmrData.documents_attached || 'Keine', 35, 430);

        // Right side boxes
        // Box 16: Carrier (Frachtführer)
        this.drawBox(doc, 295, 150, 270, 80);
        doc.fontSize(8).font('Helvetica-Bold').text('16. Frachtführer (Name, Anschrift, Land)', 300, 155);
        doc.fontSize(9).font('Helvetica')
          .text(cmrData.carrier_name, 300, 170)
          .text(cmrData.carrier_address || '', 300, 183)
          .text(cmrData.carrier_city ? `${cmrData.carrier_postal_code} ${cmrData.carrier_city}` : '', 300, 196);

        // Box 17: Successive Carriers
        this.drawBox(doc, 295, 235, 270, 40);
        doc.fontSize(8).font('Helvetica-Bold').text('17. Nachfolgende Frachtführer', 300, 240);

        // Box 18: Carrier's Reservations
        this.drawBox(doc, 295, 280, 270, 80);
        doc.fontSize(8).font('Helvetica-Bold').text('18. Vorbehalte und Bemerkungen', 300, 285);

        // Goods Description Section
        this.drawBox(doc, 30, 455, 535, 100);
        doc.fontSize(8).font('Helvetica-Bold').text('Bezeichnung der Güter', 35, 460);
        
        // Table headers
        const tableTop = 475;
        doc.fontSize(7)
          .text('Anzahl', 35, tableTop)
          .text('Art der Verpackung', 100, tableTop)
          .text('Beschreibung', 200, tableTop)
          .text('Gewicht (kg)', 380, tableTop)
          .text('Volumen (m³)', 470, tableTop);

        // Table content
        doc.fontSize(8).font('Helvetica')
          .text(cmrData.number_of_packages || '-', 35, tableTop + 15)
          .text(cmrData.method_of_packing || '-', 100, tableTop + 15)
          .text(cmrData.goods_description || order.description || '-', 200, tableTop + 15, { width: 170 })
          .text(cmrData.gross_weight || order.weight || '-', 380, tableTop + 15)
          .text(cmrData.volume || '-', 470, tableTop + 15);

        // Box 19: Special Agreements
        this.drawBox(doc, 30, 560, 260, 50);
        doc.fontSize(8).font('Helvetica-Bold').text('19. Besondere Vereinbarungen', 35, 565);
        doc.fontSize(7).font('Helvetica').text(cmrData.special_agreements || 'Keine', 35, 580, { width: 250 });

        // Box 20: Payment
        this.drawBox(doc, 295, 560, 270, 50);
        doc.fontSize(8).font('Helvetica-Bold').text('20. Zu zahlen', 300, 565);
        doc.fontSize(7).font('Helvetica')
          .text(cmrData.carriage_charges_paid ? '☑ Fracht bezahlt' : '☐ Fracht bezahlt', 300, 580)
          .text(cmrData.carriage_charges_forward ? '☑ Fracht unfrei' : '☐ Fracht unfrei', 300, 595);

        // Signature Section
        const signatureY = 620;
        
        // Box 22: Sender Signature
        this.drawBox(doc, 30, signatureY, 175, 100);
        doc.fontSize(8).font('Helvetica-Bold').text('22. Absender', 35, signatureY + 5);
        doc.fontSize(7).font('Helvetica').text('Unterschrift und Stempel des Absenders', 35, signatureY + 20);
        if (cmrData.sender_signature) {
          try {
            if (cmrData.sender_signature.startsWith('data:image')) {
              const base64Data = cmrData.sender_signature.split(',')[1];
              const imgBuffer = Buffer.from(base64Data, 'base64');
              doc.image(imgBuffer, 35, signatureY + 35, { width: 150, height: 40 });
            }
          } catch (err) {
            console.error('Error adding sender signature image:', err);
            doc.fontSize(7).text('✓ Unterschrieben', 35, signatureY + 60);
          }
          // Add signer name (person who actually signed)
          if (cmrData.sender_signed_name) {
            doc.fontSize(7).font('Helvetica').text(cmrData.sender_signed_name, 35, signatureY + 78);
          }
          doc.fontSize(6).text(new Date(cmrData.sender_signed_at).toLocaleString('de-DE'), 35, signatureY + 88);
        }

        // Box 23: Carrier Signature
        this.drawBox(doc, 210, signatureY, 175, 100);
        doc.fontSize(8).font('Helvetica-Bold').text('23. Frachtführer', 215, signatureY + 5);
        doc.fontSize(7).font('Helvetica').text('Unterschrift und Stempel des Frachtführers', 215, signatureY + 20);
        if (cmrData.carrier_signature) {
          try {
            if (cmrData.carrier_signature.startsWith('data:image')) {
              const base64Data = cmrData.carrier_signature.split(',')[1];
              const imgBuffer = Buffer.from(base64Data, 'base64');
              doc.image(imgBuffer, 215, signatureY + 35, { width: 150, height: 40 });
            }
          } catch (err) {
            console.error('Error adding carrier signature image:', err);
            doc.fontSize(7).text('✓ Unterschrieben', 215, signatureY + 60);
          }
          // Add carrier name
          if (cmrData.carrier_name) {
            doc.fontSize(7).font('Helvetica').text(cmrData.carrier_name, 215, signatureY + 78);
          }
          doc.fontSize(6).text(new Date(cmrData.carrier_signed_at).toLocaleString('de-DE'), 215, signatureY + 88);
        }

        // Box 24: Consignee Signature
        this.drawBox(doc, 390, signatureY, 175, 100);
        doc.fontSize(8).font('Helvetica-Bold').text('24. Empfänger', 395, signatureY + 5);
        doc.fontSize(7).font('Helvetica').text('Unterschrift und Stempel des Empfängers', 395, signatureY + 20);
        if (cmrData.consignee_signature) {
          // Display signature image if it's a base64 string
          try {
            if (cmrData.consignee_signature.startsWith('data:image')) {
              const base64Data = cmrData.consignee_signature.split(',')[1];
              const imgBuffer = Buffer.from(base64Data, 'base64');
              doc.image(imgBuffer, 395, signatureY + 35, { width: 150, height: 40 });
            }
          } catch (err) {
            console.error('Error adding signature image:', err);
            doc.fontSize(7).text('✓ Unterschrieben', 395, signatureY + 60);
          }
          // Add signer name (person who actually signed)
          if (cmrData.consignee_signed_name) {
            doc.fontSize(7).font('Helvetica').text(cmrData.consignee_signed_name, 395, signatureY + 78);
          }
          doc.fontSize(6).text(new Date(cmrData.consignee_signed_at).toLocaleString('de-DE'), 395, signatureY + 88);
        }
        if (cmrData.consignee_remarks) {
          doc.fontSize(6).text(`Bemerkungen: ${cmrData.consignee_remarks}`, 395, signatureY + 95, { width: 165 });
        }

        // Footer
        doc.fontSize(6).font('Helvetica').text(
          `FB Transporte • ${cmrData.carrier_address || 'Adresse'} • Tel: ${process.env.COMPANY_PHONE || ''}`,
          30, 750,
          { align: 'center' }
        );

        // Add delivery photo on new page if available
        if (cmrData.consignee_photo) {
          doc.addPage();
          doc.fontSize(16).font('Helvetica-Bold').text('Zustellnachweis - Foto', 30, 30);
          doc.fontSize(10).font('Helvetica').text(`CMR Nr: ${cmrData.cmr_number}`, 30, 55);
          doc.fontSize(10).text(`Empfänger: ${cmrData.consignee_name || 'Briefkasten'}`, 30, 70);
          doc.fontSize(10).text(`Zugestellt am: ${cmrData.consignee_signed_at ? new Date(cmrData.consignee_signed_at).toLocaleString('de-DE') : ''}`, 30, 85);
          
          try {
            if (cmrData.consignee_photo && cmrData.consignee_photo.startsWith('data:image')) {
              const base64Data = cmrData.consignee_photo.split(',')[1];
              const imgBuffer = Buffer.from(base64Data, 'base64');
              
              // Determine image dimensions to fit properly
              const maxWidth = 535;
              const maxHeight = 600;
              
              // Add photo with proper sizing
              doc.image(imgBuffer, 30, 110, { 
                fit: [maxWidth, maxHeight],
                align: 'center',
                valign: 'center'
              });
              
              console.log('✅ Delivery photo added to CMR PDF');
            } else {
              console.log('⚠️ No valid photo data found');
              doc.fontSize(10).text('Kein Foto verfügbar', 30, 110);
            }
          } catch (err) {
            console.error('❌ Error adding delivery photo:', err.message);
            doc.fontSize(10).text(`Foto konnte nicht geladen werden: ${err.message}`, 30, 110);
          }
        }

        doc.end();

        stream.on('finish', () => {
          resolve({ filepath, filename });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static drawBox(doc, x, y, width, height) {
    doc.rect(x, y, width, height).stroke();
  }
}

module.exports = CMRPdfGenerator;
