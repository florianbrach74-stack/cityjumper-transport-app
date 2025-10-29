const CMR = require('../models/CMR');
const Order = require('../models/Order');
const User = require('../models/User');
const CMRPdfGenerator = require('../services/cmrPdfGenerator');
const { sendEmail } = require('../config/email');

const createCMRForOrder = async (orderId) => {
  try {
    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Get contractor details
    const contractor = await User.findById(order.contractor_id);
    if (!contractor) {
      throw new Error('Contractor not found');
    }

    // Prepare CMR data from order
    const cmrData = {
      order_id: orderId,
      
      // Sender (from pickup)
      sender_name: order.pickup_contact_name || `${order.customer_first_name} ${order.customer_last_name}`,
      sender_address: order.pickup_address,
      sender_city: order.pickup_city,
      sender_postal_code: order.pickup_postal_code,
      sender_country: order.pickup_country || 'Deutschland',
      
      // Consignee (from delivery)
      consignee_name: order.delivery_contact_name || 'Empfänger',
      consignee_address: order.delivery_address,
      consignee_city: order.delivery_city,
      consignee_postal_code: order.delivery_postal_code,
      consignee_country: order.delivery_country || 'Deutschland',
      
      // Carrier (contractor)
      carrier_name: contractor.company_name || `${contractor.first_name} ${contractor.last_name}`,
      carrier_address: contractor.address || '',
      carrier_city: contractor.city || '',
      carrier_postal_code: contractor.postal_code || '',
      
      // Shipment details
      place_of_loading: `${order.pickup_city}, ${order.pickup_country || 'Deutschland'}`,
      place_of_delivery: `${order.delivery_city}, ${order.delivery_country || 'Deutschland'}`,
      documents_attached: 'Lieferschein',
      
      goods_description: order.description || 'Allgemeine Fracht',
      number_of_packages: order.pallets || 1,
      method_of_packing: order.pallets ? `${order.pallets} Palette(n)` : 'Paket',
      marks_and_numbers: `Auftrag #${orderId}`,
      gross_weight: order.weight,
      volume: order.length && order.width && order.height 
        ? (order.length * order.width * order.height / 1000000).toFixed(2)
        : null,
      
      special_agreements: order.special_requirements || 'Keine besonderen Vereinbarungen',
      carriage_charges_paid: true,
      carriage_charges_forward: false,
      cash_on_delivery: null,
    };

    // Create CMR document
    const cmr = await CMR.create(cmrData);

    // Generate PDF
    const { filepath, filename } = await CMRPdfGenerator.generateCMR(cmr, order);
    
    // Update CMR with PDF URL
    const pdfUrl = `/uploads/cmr/${filename}`;
    await CMR.updatePdfUrl(cmr.id, pdfUrl);

    return { ...cmr, pdf_url: pdfUrl };
  } catch (error) {
    console.error('Error creating CMR:', error);
    throw error;
  }
};

const getCMRByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const cmr = await CMR.findByOrderId(orderId);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR document not found' });
    }

    // Check authorization
    const order = await Order.findById(orderId);
    if (
      req.user.role === 'customer' && order.customer_id !== req.user.id ||
      req.user.role === 'contractor' && order.contractor_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ cmr });
  } catch (error) {
    console.error('Get CMR error:', error);
    res.status(500).json({ error: 'Server error while fetching CMR' });
  }
};

const getCMRByCMRNumber = async (req, res) => {
  try {
    const { cmrNumber } = req.params;
    
    const cmr = await CMR.findByCMRNumber(cmrNumber);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR document not found' });
    }

    res.json({ cmr });
  } catch (error) {
    console.error('Get CMR error:', error);
    res.status(500).json({ error: 'Server error while fetching CMR' });
  }
};

const addSignature = async (req, res) => {
  try {
    const { cmrId } = req.params;
    const { signatureType, signatureData, location, remarks, consigneeName, photoUrl } = req.body;

    console.log('Adding signature:', { cmrId, signatureType, hasUser: !!req.user, hasPhoto: !!photoUrl });

    if (!['sender', 'carrier', 'consignee'].includes(signatureType)) {
      return res.status(400).json({ error: 'Invalid signature type' });
    }

    const cmr = await CMR.findById(cmrId);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR document not found' });
    }

    // Authorization check - only if user is logged in
    const order = await Order.findById(cmr.order_id);
    
    if (req.user) {
      // User is logged in - check permissions
      if (signatureType === 'sender' && req.user.role === 'customer' && order.customer_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (signatureType === 'carrier' && req.user.role === 'contractor' && order.contractor_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // For consignee, allow public access (no login required)
    // This will be used on mobile signature page

    const updatedCMR = await CMR.addSignature(cmrId, signatureType, signatureData, location, remarks, consigneeName, photoUrl);

    // Regenerate PDF with signature
    const { filepath } = await CMRPdfGenerator.generateCMR(updatedCMR, order);

    // Handle carrier signature - update order status to picked_up
    if (signatureType === 'carrier') {
      const customer = await User.findById(order.customer_id);
      const contractor = await User.findById(order.contractor_id);

      // Update order status to picked_up
      await Order.updateStatus(order.id, 'picked_up');

      // Email to customer
      await sendEmail(
        customer.email,
        '📦 Sendung abgeholt - Transport gestartet',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Sendung wurde abgeholt</h2>
            <p>Hallo ${customer.first_name} ${customer.last_name},</p>
            <p>Ihr Transportauftrag wurde erfolgreich abgeholt und ist nun unterwegs.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Auftrags-Details:</h3>
              <p><strong>Auftrag:</strong> #${order.id}</p>
              <p><strong>Abgeholt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
              <p><strong>Abholung:</strong> ${order.pickup_address}, ${order.pickup_city}</p>
              <p><strong>Ziel:</strong> ${order.delivery_address}, ${order.delivery_city}</p>
              <p><strong>Fahrer:</strong> ${contractor.company_name || contractor.first_name + ' ' + contractor.last_name}</p>
            </div>
            
            <p>Das CMR-Dokument wurde vom Absender und Frachtführer unterschrieben.</p>
            <p>Sie werden benachrichtigt, sobald die Sendung zugestellt wurde.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr CityJumper Team</p>
          </div>
        `
      );
    }

    // Send notification emails
    if (signatureType === 'consignee') {
      const customer = await User.findById(order.customer_id);
      const contractor = await User.findById(order.contractor_id);

      // Email to customer
      await sendEmail(
        customer.email,
        '✅ Lieferung bestätigt - CMR unterschrieben',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Lieferung erfolgreich abgeschlossen</h2>
            <p>Hallo ${customer.first_name} ${customer.last_name},</p>
            <p>Ihr Transportauftrag #${order.id} wurde erfolgreich zugestellt und vom Empfänger unterschrieben.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">CMR-Details:</h3>
              <p><strong>CMR-Nummer:</strong> ${updatedCMR.cmr_number}</p>
              <p><strong>Zugestellt am:</strong> ${new Date(updatedCMR.delivered_at).toLocaleString('de-DE')}</p>
              <p><strong>Ort:</strong> ${location}</p>
              ${remarks ? `<p><strong>Bemerkungen:</strong> ${remarks}</p>` : ''}
            </div>
            
            <p>Das unterschriebene CMR-Dokument steht in Ihrem Dashboard zum Download bereit.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr ZipMend Team</p>
          </div>
        `
      );

      // Email to contractor
      await sendEmail(
        contractor.email,
        '✅ Lieferung bestätigt - CMR unterschrieben',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Lieferung erfolgreich abgeschlossen</h2>
            <p>Hallo ${contractor.first_name} ${contractor.last_name},</p>
            <p>Der Transportauftrag #${order.id} wurde erfolgreich zugestellt und vom Empfänger unterschrieben.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">CMR-Details:</h3>
              <p><strong>CMR-Nummer:</strong> ${updatedCMR.cmr_number}</p>
              <p><strong>Zugestellt am:</strong> ${new Date(updatedCMR.delivered_at).toLocaleString('de-DE')}</p>
              <p><strong>Ort:</strong> ${location}</p>
              ${remarks ? `<p><strong>Bemerkungen:</strong> ${remarks}</p>` : ''}
            </div>
            
            <p>Das unterschriebene CMR-Dokument steht in Ihrem Dashboard zum Download bereit.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr ZipMend Team</p>
          </div>
        `
      );

      // Update order status to completed
      await Order.updateStatus(order.id, 'completed');
    }

    res.json({
      message: 'Signature added successfully',
      cmr: updatedCMR,
    });
  } catch (error) {
    console.error('Add signature error:', error);
    res.status(500).json({ error: 'Server error while adding signature' });
  }
};

// PUBLIC signature endpoint (no auth required)
const addPublicSignature = async (req, res) => {
  try {
    const { cmrNumber } = req.params;
    const { signatureData, location, remarks, consigneeName, photoUrl } = req.body;

    // Determine signature type from URL path
    const urlPath = req.path;
    let signatureType = 'consignee'; // default
    if (urlPath.includes('/sender')) {
      signatureType = 'sender';
    } else if (urlPath.includes('/carrier')) {
      signatureType = 'carrier';
    } else if (urlPath.includes('/consignee')) {
      signatureType = 'consignee';
    }

    console.log('Public signature for CMR:', cmrNumber, 'Type:', signatureType);

    // Find CMR by number
    const cmr = await CMR.findByCMRNumber(cmrNumber);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR document not found' });
    }

    // Get order to fetch contractor name for carrier signature
    const order = await Order.findById(cmr.order_id);
    let signerName = consigneeName;
    
    if (signatureType === 'carrier' && order.contractor_id) {
      // Auto-fill carrier name from contractor account
      const contractor = await User.findById(order.contractor_id);
      signerName = `${contractor.first_name} ${contractor.last_name}`;
    }

    const updatedCMR = await CMR.addSignature(
      cmr.id, 
      signatureType, 
      signatureData, 
      location, 
      remarks, 
      signerName, 
      photoUrl
    );

    // Update order status to completed only for consignee signature
    if (signatureType === 'consignee') {
      await Order.updateStatus(cmr.order_id, 'completed');
    }

    // Regenerate PDF with signature
    await CMRPdfGenerator.generateCMR(updatedCMR, order);

    // Send notification emails
    const customer = await User.findById(order.customer_id);
    const contractor = await User.findById(order.contractor_id);

    // Email to customer
    await sendEmail(
      customer.email,
      '✅ Lieferung bestätigt - CMR unterschrieben',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Lieferung erfolgreich abgeschlossen</h2>
          <p>Hallo ${customer.first_name} ${customer.last_name},</p>
          <p>Ihr Transportauftrag wurde erfolgreich zugestellt und vom Empfänger bestätigt.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">CMR-Details:</h3>
            <p><strong>CMR-Nummer:</strong> ${updatedCMR.cmr_number}</p>
            <p><strong>Empfänger:</strong> ${consigneeName}</p>
            <p><strong>Zugestellt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
            <p><strong>Ort:</strong> ${location}</p>
            ${remarks ? `<p><strong>Bemerkungen:</strong> ${remarks}</p>` : ''}
          </div>
          
          <p>Das unterschriebene CMR-Dokument steht in Ihrem Dashboard zum Download bereit.</p>
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr CityJumper Team</p>
        </div>
      `
    );

    // Email to contractor
    await sendEmail(
      contractor.email,
      '✅ Lieferung bestätigt - CMR unterschrieben',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Lieferung erfolgreich abgeschlossen</h2>
          <p>Hallo ${contractor.first_name} ${contractor.last_name},</p>
          <p>Der Transportauftrag wurde erfolgreich zugestellt und vom Empfänger bestätigt.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">CMR-Details:</h3>
            <p><strong>CMR-Nummer:</strong> ${updatedCMR.cmr_number}</p>
            <p><strong>Empfänger:</strong> ${consigneeName}</p>
            <p><strong>Zugestellt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
          </div>
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr CityJumper Team</p>
        </div>
      `
    );

    res.json({
      message: 'Signature added successfully',
      cmr: updatedCMR,
    });
  } catch (error) {
    console.error('Public signature error:', error);
    res.status(500).json({ error: 'Server error while adding signature' });
  }
};

const getMyCMRs = async (req, res) => {
  try {
    let filters = {};

    if (req.user.role === 'customer') {
      filters.customer_id = req.user.id;
    } else if (req.user.role === 'contractor') {
      filters.contractor_id = req.user.id;
    }

    const cmrs = await CMR.getAll(filters);
    res.json({ cmrs });
  } catch (error) {
    console.error('Get CMRs error:', error);
    res.status(500).json({ error: 'Server error while fetching CMRs' });
  }
};

const downloadCMRPdf = async (req, res) => {
  try {
    const { cmrNumber } = req.params;
    
    console.log('📥 PDF Download requested for CMR:', cmrNumber);
    
    // Find CMR by number
    const cmr = await CMR.findByCMRNumber(cmrNumber);
    if (!cmr) {
      console.error('❌ CMR not found:', cmrNumber);
      return res.status(404).json({ error: 'CMR document not found' });
    }

    console.log('✅ CMR found:', cmr.id);

    // Get order for PDF generation
    const order = await Order.findById(cmr.order_id);
    if (!order) {
      console.error('❌ Order not found:', cmr.order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('✅ Order found:', order.id);
    
    // Generate PDF (always regenerate to ensure it's up to date)
    console.log('🔄 Generating PDF...');
    const { filepath, filename } = await CMRPdfGenerator.generateCMR(cmr, order);
    
    console.log('✅ PDF generated:', filepath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filepath)) {
      console.error('❌ PDF file not found at:', filepath);
      return res.status(404).json({ error: 'PDF file not found' });
    }

    console.log('📤 Sending PDF file...');
    
    // Send PDF file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('❌ Error sending PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading PDF' });
        }
      } else {
        console.log('✅ PDF sent successfully');
      }
    });
  } catch (error) {
    console.error('❌ Download CMR PDF error:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error while downloading CMR PDF', details: error.message });
    }
  }
};

// Confirm pickup with sender and carrier signatures
const confirmPickup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { senderName, senderSignature, carrierSignature } = req.body;
    const contractorId = req.user.id;

    console.log('📦 Pickup confirmation started for order:', orderId);
    console.log('Contractor ID:', contractorId);

    // Validate input
    if (!senderName || !senderSignature || !carrierSignature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify order belongs to this contractor
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.contractor_id !== contractorId) {
      console.error('❌ Unauthorized access. Order contractor:', order.contractor_id, 'User:', contractorId);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log('✅ Order verified, status:', order.status);

    // Get or create CMR
    let cmr = await CMR.findByOrderId(orderId);
    if (!cmr) {
      console.log('📄 Creating new CMR for order:', orderId);
      cmr = await CMR.create(orderId);
    }
    console.log('✅ CMR ready, ID:', cmr.id);

    // Get contractor details
    const contractor = await User.findById(contractorId);
    if (!contractor) {
      console.error('❌ Contractor not found:', contractorId);
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Update CMR with signatures
    const pool = require('../config/database');
    const carrierName = contractor.company_name || `${contractor.first_name} ${contractor.last_name}`;
    
    console.log('💾 Updating CMR with signatures...');
    await pool.query(
      `UPDATE cmr 
       SET sender_name = $1,
           sender_signature = $2,
           sender_signed_at = CURRENT_TIMESTAMP,
           carrier_name = $3,
           carrier_signature = $4,
           carrier_signed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        senderName,
        senderSignature,
        carrierName,
        carrierSignature,
        cmr.id
      ]
    );
    console.log('✅ CMR signatures saved');

    // Update order status to picked_up
    console.log('📊 Updating order status to picked_up...');
    await Order.updateStatus(orderId, 'picked_up');
    console.log('✅ Order status updated');

    // Regenerate CMR PDF with signatures
    console.log('📄 Regenerating CMR PDF...');
    const updatedCmr = await CMR.findByOrderId(orderId);
    
    try {
      await CMRPdfGenerator.generateCMR(updatedCmr, order);
      console.log('✅ CMR PDF generated');
    } catch (pdfError) {
      console.error('⚠️ CMR PDF generation failed (non-critical):', pdfError.message);
    }

    // Send email to customer
    try {
      const customer = await User.findById(order.customer_id);
      await sendEmail(
        customer.email,
        '📦 Paket abgeholt - Auftrag in Bearbeitung',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Paket erfolgreich abgeholt</h2>
            <p>Hallo ${customer.first_name} ${customer.last_name},</p>
            <p>Ihr Paket wurde vom Frachtführer abgeholt und ist nun unterwegs.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Auftrags-Details:</h3>
              <p><strong>Auftrag:</strong> #${order.id}</p>
              <p><strong>Abholung:</strong> ${order.pickup_address}, ${order.pickup_city}</p>
              <p><strong>Zustellung:</strong> ${order.delivery_address}, ${order.delivery_city}</p>
              <p><strong>Frachtführer:</strong> ${contractor.company_name || contractor.first_name + ' ' + contractor.last_name}</p>
            </div>
            
            <p>Sie werden benachrichtigt, sobald das Paket zugestellt wurde.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr CityJumper Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('⚠️ Email notification failed (non-critical):', emailError.message);
    }

    res.json({
      message: 'Pickup confirmed successfully',
      cmr: updatedCmr,
      order: { ...order, status: 'picked_up' }
    });
  } catch (error) {
    console.error('❌ Confirm pickup error:', error);
    res.status(500).json({ error: 'Server error while confirming pickup' });
  }
};

// Confirm delivery with receiver signature
const confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receiverName, receiverSignature } = req.body;
    const contractorId = req.user.id;

    // Verify order belongs to this contractor
    const order = await Order.findById(orderId);
    if (!order || order.contractor_id !== contractorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get CMR
    const cmr = await CMR.findByOrderId(orderId);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR not found' });
    }

    // Update CMR with receiver signature
    const pool = require('../config/database');
    await pool.query(
      `UPDATE cmr 
       SET consignee_name = $1,
           consignee_signature = $2,
           consignee_signed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [receiverName, receiverSignature, cmr.id]
    );

    // Update order status to delivered
    await Order.updateStatus(orderId, 'delivered');

    // Regenerate CMR PDF with all signatures
    const updatedCmr = await CMR.findByOrderId(orderId);
    await CMRPdfGenerator.generateCMR(updatedCmr, order);

    // Send email to customer with CMR
    try {
      const customer = await User.findById(order.customer_id);
      const contractor = await User.findById(contractorId);
      
      await sendEmail(
        customer.email,
        '✅ Paket zugestellt - Auftrag abgeschlossen',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Paket erfolgreich zugestellt</h2>
            <p>Hallo ${customer.first_name} ${customer.last_name},</p>
            <p>Ihr Paket wurde erfolgreich zugestellt und vom Empfänger entgegengenommen.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0;">Auftrags-Details:</h3>
              <p><strong>Auftrag:</strong> #${order.id}</p>
              <p><strong>Zustellung:</strong> ${order.delivery_address}, ${order.delivery_city}</p>
              <p><strong>Empfänger:</strong> ${receiverName}</p>
              <p><strong>Zugestellt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
            </div>
            
            <p>Das vollständige CMR-Dokument mit allen Unterschriften finden Sie im Anhang oder in Ihrem Dashboard.</p>
            
            <p style="margin-top: 30px;">Vielen Dank für Ihr Vertrauen!<br>Ihr CityJumper Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('⚠️ Email notification failed (non-critical):', emailError.message);
    }

    res.json({
      message: 'Delivery confirmed successfully',
      cmr: updatedCmr,
      order: { ...order, status: 'delivered' }
    });
  } catch (error) {
    console.error('❌ Confirm delivery error:', error);
    res.status(500).json({ error: 'Server error while confirming delivery' });
  }
};

module.exports = {
  createCMRForOrder,
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  addPublicSignature,
  getMyCMRs,
  downloadCMRPdf,
  confirmPickup,
  confirmDelivery,
};
