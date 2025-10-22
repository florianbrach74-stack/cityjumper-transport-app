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
    const { signatureType, signatureData, location, remarks } = req.body;

    if (!['sender', 'carrier', 'consignee'].includes(signatureType)) {
      return res.status(400).json({ error: 'Invalid signature type' });
    }

    const cmr = await CMR.findById(cmrId);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR document not found' });
    }

    // Authorization check
    const order = await Order.findById(cmr.order_id);
    
    if (signatureType === 'sender' && req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (signatureType === 'carrier' && req.user.role === 'contractor' && order.contractor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For consignee, allow public access with CMR number verification
    // This will be used on mobile signature page

    const updatedCMR = await CMR.addSignature(cmrId, signatureType, signatureData, location, remarks);

    // Regenerate PDF with signature
    const { filepath } = await CMRPdfGenerator.generateCMR(updatedCMR, order);

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

module.exports = {
  createCMRForOrder,
  getCMRByOrderId,
  getCMRByCMRNumber,
  addSignature,
  getMyCMRs,
};
