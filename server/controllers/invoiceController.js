const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');
const { sendEmail } = require('../config/email');
const fs = require('fs').promises;
const path = require('path');

/**
 * Create bulk invoice from multiple orders
 */
const createBulkInvoice = async (req, res) => {
  try {
    const { orderIds, customerId, notes, dueDate } = req.body;
    const createdBy = req.user.id;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Mindestens ein Auftrag muss ausgewählt werden' });
    }
    
    if (!customerId) {
      return res.status(400).json({ error: 'Kunden-ID ist erforderlich' });
    }
    
    const invoice = await Invoice.create({
      customerId,
      orderIds,
      notes,
      createdBy,
      dueDate
    });
    
    res.json({
      success: true,
      message: 'Rechnung erfolgreich erstellt',
      invoice
    });
    
  } catch (error) {
    console.error('Create bulk invoice error:', error);
    res.status(500).json({ error: error.message || 'Fehler beim Erstellen der Rechnung' });
  }
};

/**
 * Get all invoices
 */
const getAllInvoices = async (req, res) => {
  try {
    const { page, limit, status, customerId } = req.query;
    
    const result = await Invoice.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      customerId: customerId ? parseInt(customerId) : null
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Rechnungen' });
  }
};

/**
 * Get single invoice
 */
const getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    }
    
    res.json(invoice);
    
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Rechnung' });
  }
};

/**
 * Generate PDF for invoice
 */
const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    }
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rechnung-${invoice.invoice_number}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Company header
    doc.fontSize(20).text('Courierly', { align: 'left' });
    doc.fontSize(10).text('Express Delivery Service', { align: 'left' });
    doc.moveDown();
    
    // Invoice title
    doc.fontSize(16).text(`RECHNUNG ${invoice.invoice_number}`, { align: 'right' });
    doc.moveDown();
    
    // Customer info
    doc.fontSize(12).text('Rechnungsempfänger:', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.company_name || `${invoice.first_name} ${invoice.last_name}`);
    if (invoice.address) doc.text(invoice.address);
    if (invoice.postal_code && invoice.city) doc.text(`${invoice.postal_code} ${invoice.city}`);
    doc.moveDown();
    
    // Invoice details
    doc.fontSize(10);
    doc.text(`Rechnungsdatum: ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}`);
    doc.text(`Fälligkeitsdatum: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}`);
    doc.moveDown(2);
    
    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Pos.', 50, tableTop, { width: 30 });
    doc.text('Beschreibung', 90, tableTop, { width: 280 });
    doc.text('Menge', 380, tableTop, { width: 50, align: 'right' });
    doc.text('Einzelpreis', 440, tableTop, { width: 60, align: 'right' });
    doc.text('Gesamt', 510, tableTop, { width: 60, align: 'right' });
    
    doc.moveTo(50, tableTop + 15).lineTo(570, tableTop + 15).stroke();
    
    // Table items
    doc.font('Helvetica');
    let yPosition = tableTop + 25;
    
    invoice.items.forEach((item, index) => {
      doc.text((index + 1).toString(), 50, yPosition, { width: 30 });
      doc.text(item.description, 90, yPosition, { width: 280 });
      doc.text(item.quantity.toString(), 380, yPosition, { width: 50, align: 'right' });
      doc.text(`${parseFloat(item.unit_price).toFixed(2)} €`, 440, yPosition, { width: 60, align: 'right' });
      doc.text(`${parseFloat(item.total_price).toFixed(2)} €`, 510, yPosition, { width: 60, align: 'right' });
      
      yPosition += 30;
      
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });
    
    // Totals
    yPosition += 10;
    doc.moveTo(50, yPosition).lineTo(570, yPosition).stroke();
    yPosition += 15;
    
    doc.font('Helvetica');
    doc.text('Zwischensumme:', 380, yPosition, { width: 120, align: 'right' });
    doc.text(`${parseFloat(invoice.subtotal).toFixed(2)} €`, 510, yPosition, { width: 60, align: 'right' });
    
    yPosition += 20;
    doc.text(`MwSt. ${invoice.tax_rate}%:`, 380, yPosition, { width: 120, align: 'right' });
    doc.text(`${parseFloat(invoice.tax_amount).toFixed(2)} €`, 510, yPosition, { width: 60, align: 'right' });
    
    yPosition += 20;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Gesamtsumme:', 380, yPosition, { width: 120, align: 'right' });
    doc.text(`${parseFloat(invoice.total_amount).toFixed(2)} €`, 510, yPosition, { width: 60, align: 'right' });
    
    // Notes
    if (invoice.notes) {
      yPosition += 40;
      doc.font('Helvetica').fontSize(10);
      doc.text('Anmerkungen:', 50, yPosition);
      yPosition += 15;
      doc.text(invoice.notes, 50, yPosition, { width: 520 });
    }
    
    // Footer
    doc.fontSize(8).text(
      'Vielen Dank für Ihr Vertrauen! | Courierly GmbH | info@courierly.de',
      50,
      750,
      { align: 'center', width: 520 }
    );
    
    doc.end();
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der PDF' });
  }
};

/**
 * Send invoice via email
 */
const sendInvoiceEmail = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    }
    
    // Send email
    await sendEmail({
      to: invoice.email,
      subject: `Rechnung ${invoice.invoice_number} von Courierly`,
      html: `
        <h2>Ihre Rechnung von Courierly</h2>
        <p>Sehr geehrte/r ${invoice.company_name || `${invoice.first_name} ${invoice.last_name}`},</p>
        <p>anbei erhalten Sie Ihre Rechnung für die erbrachten Leistungen.</p>
        <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}<br>
        <strong>Rechnungsdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}<br>
        <strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}<br>
        <strong>Gesamtbetrag:</strong> ${parseFloat(invoice.total_amount).toFixed(2)} €</p>
        <p>Die Rechnung können Sie hier herunterladen: <a href="${process.env.FRONTEND_URL}/invoices/${invoice.id}/pdf">Rechnung herunterladen</a></p>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
      `
    });
    
    // Update invoice status
    await Invoice.updateStatus(invoiceId, 'sent');
    
    res.json({
      success: true,
      message: 'Rechnung erfolgreich versendet'
    });
    
  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({ error: 'Fehler beim Versenden der Rechnung' });
  }
};

/**
 * Update invoice status
 */
const updateInvoiceStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }
    
    const invoice = await Invoice.updateStatus(invoiceId, status);
    
    res.json({
      success: true,
      message: 'Status erfolgreich aktualisiert',
      invoice
    });
    
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Status' });
  }
};

/**
 * Delete invoice
 */
const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    await Invoice.delete(invoiceId);
    
    res.json({
      success: true,
      message: 'Rechnung erfolgreich gelöscht'
    });
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Rechnung' });
  }
};

module.exports = {
  createBulkInvoice,
  getAllInvoices,
  getInvoice,
  generateInvoicePDF,
  sendInvoiceEmail,
  updateInvoiceStatus,
  deleteInvoice
};
