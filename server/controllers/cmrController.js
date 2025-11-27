const CMR = require('../models/CMR');
const Order = require('../models/Order');
const User = require('../models/User');
const CMRPdfGenerator = require('../services/cmrPdfGenerator');
const { sendEmail } = require('../config/email');

// Helper function to check if all deliveries go to same RECIPIENT (address + name)
const checkSameDeliveryRecipient = (order, deliveryStops) => {
  if (deliveryStops.length === 0) return false;
  
  const mainRecipient = {
    name: (order.delivery_contact_name || order.delivery_company || '')?.toLowerCase().trim(),
    address: order.delivery_address?.toLowerCase().trim(),
    city: order.delivery_city?.toLowerCase().trim(),
    postal_code: order.delivery_postal_code?.toLowerCase().trim()
  };
  
  // Check if all stops have same recipient (name + address)
  return deliveryStops.every(stop => {
    const stopName = (stop.contact_name || stop.company || '')?.toLowerCase().trim();
    return stopName === mainRecipient.name &&
           stop.address?.toLowerCase().trim() === mainRecipient.address &&
           stop.city?.toLowerCase().trim() === mainRecipient.city &&
           stop.postal_code?.toLowerCase().trim() === mainRecipient.postal_code;
  });
};

// Helper function to check if all pickups go to same address
const checkSamePickupAddress = (order, pickupStops) => {
  if (pickupStops.length === 0) return false;
  
  const mainAddress = {
    address: order.pickup_address?.toLowerCase().trim(),
    city: order.pickup_city?.toLowerCase().trim(),
    postal_code: order.pickup_postal_code?.toLowerCase().trim()
  };
  
  // Check if all stops have same address as main pickup
  return pickupStops.every(stop => {
    return stop.address?.toLowerCase().trim() === mainAddress.address &&
           stop.city?.toLowerCase().trim() === mainAddress.city &&
           stop.postal_code?.toLowerCase().trim() === mainAddress.postal_code;
  });
};

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

    // Parse pickup and delivery stops if they exist
    let pickupStops = [];
    let deliveryStops = [];
    
    try {
      if (order.pickup_stops && typeof order.pickup_stops === 'string') {
        pickupStops = JSON.parse(order.pickup_stops);
      } else if (Array.isArray(order.pickup_stops)) {
        pickupStops = order.pickup_stops;
      }
    } catch (e) {
      console.log('No pickup stops or parse error:', e.message);
    }
    
    try {
      if (order.delivery_stops && typeof order.delivery_stops === 'string') {
        deliveryStops = JSON.parse(order.delivery_stops);
      } else if (Array.isArray(order.delivery_stops)) {
        deliveryStops = order.delivery_stops;
      }
    } catch (e) {
      console.log('No delivery stops or parse error:', e.message);
    }

    const hasMultiplePickups = pickupStops.length > 0;
    const hasMultipleDeliveries = deliveryStops.length > 0;
    const totalPickups = hasMultiplePickups ? pickupStops.length + 1 : 1;
    const totalDeliveries = hasMultipleDeliveries ? deliveryStops.length + 1 : 1;
    
    // Check if all pickups/deliveries are from/to same address/recipient
    const samePickupAddress = hasMultiplePickups && checkSamePickupAddress(order, pickupStops);
    const sameDeliveryRecipient = hasMultipleDeliveries && checkSameDeliveryRecipient(order, deliveryStops);
    
    // Determine signature sharing logic
    // Sender can share signature if:
    // - No multiple pickups OR all pickups from same address
    const canShareSenderSignature = !hasMultiplePickups || samePickupAddress;
    
    // Carrier always same
    const canShareCarrierSignature = true;
    
    // Receiver can share signature if:
    // - Multiple deliveries AND all go to SAME RECIPIENT (address + name)
    // - OR multiple pickups AND single delivery (e.g. 3 Möbelhäuser → 1 Kunde)
    const canShareReceiverSignature = 
      (hasMultipleDeliveries && sameDeliveryRecipient) ||
      (hasMultiplePickups && !hasMultipleDeliveries);
    
    const cmrGroupId = `ORDER-${orderId}`;

    console.log(`📦 Creating CMR(s) for order ${orderId}`);
    console.log(`   Multiple Pickups: ${hasMultiplePickups ? 'Yes' : 'No'} (${totalPickups})`);
    console.log(`   Multiple Deliveries: ${hasMultipleDeliveries ? 'Yes' : 'No'} (${totalDeliveries})`);
    console.log(`   Can share sender signature: ${canShareSenderSignature}`);
    console.log(`   Can share receiver signature: ${canShareReceiverSignature}`);

    const createdCMRs = [];
    
    // Total stops = total deliveries (we create one CMR per delivery)
    const totalStops = totalDeliveries;

    // Helper function to create CMR data
    const createCMRData = (deliveryInfo, stopIndex, isMainDelivery = false, pickupInfo = null) => {
      // Use provided pickup info or default to main pickup
      const senderInfo = pickupInfo || {
        contact_name: order.pickup_contact_name || `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim(),
        address: order.pickup_address,
        city: order.pickup_city,
        postal_code: order.pickup_postal_code,
        country: order.pickup_country
      };
      
      return {
        order_id: orderId,
        cmr_group_id: cmrGroupId,
        delivery_stop_index: stopIndex,
        total_stops: totalStops,
        is_multi_stop: hasMultipleDeliveries || hasMultiplePickups,
        can_share_sender_signature: canShareSenderSignature,
        can_share_receiver_signature: canShareReceiverSignature,
        
        // Sender (from pickup) - Can be different if multiple pickups
        sender_name: senderInfo.contact_name || `${order.customer_first_name} ${order.customer_last_name}`,
        sender_address: senderInfo.address,
        sender_city: senderInfo.city,
        sender_postal_code: senderInfo.postal_code,
        sender_country: senderInfo.country || 'Deutschland',
        
        // Consignee (DIFFERENT for each stop)
        consignee_name: deliveryInfo.contact_name || deliveryInfo.company || 'Empfänger',
        consignee_address: deliveryInfo.address,
        consignee_city: deliveryInfo.city,
        consignee_postal_code: deliveryInfo.postal_code,
        consignee_country: deliveryInfo.country || 'Deutschland',
        
        // Carrier (contractor) - SAME for all CMRs
        carrier_name: contractor.company_name || `${contractor.first_name} ${contractor.last_name}`,
        carrier_address: contractor.company_address || '',
        carrier_city: contractor.company_city || '',
        carrier_postal_code: contractor.company_postal_code || '',
        
        // Shipment details
        place_of_loading: `${order.pickup_city}, ${order.pickup_country || 'Deutschland'}`,
        place_of_delivery: `${deliveryInfo.city}, ${deliveryInfo.country || 'Deutschland'}`,
        documents_attached: 'Lieferschein',
        
        goods_description: order.description || 'Allgemeine Fracht',
        number_of_packages: order.pallets || 1,
        method_of_packing: order.pallets ? `${order.pallets} Palette(n)` : 'Paket',
        marks_and_numbers: hasMultipleDeliveries 
          ? `Auftrag #${orderId} - Zustellung ${stopIndex + 1}/${totalStops}`
          : `Auftrag #${orderId}`,
        gross_weight: order.weight,
        volume: order.length && order.width && order.height 
          ? (order.length * order.width * order.height / 1000000).toFixed(2)
          : null,
        
        special_agreements: [
          order.special_requirements,
          order.needs_loading_help ? 'Beladehilfe erforderlich (+€6)' : null,
          order.needs_unloading_help ? 'Entladehilfe erforderlich (+€6)' : null,
          order.legal_delivery ? '⚠️ RECHTSSICHERE ZUSTELLUNG: Lassen Sie sich vom Absender das Transportgut zeigen (z.B. Kündigung) und bestätigen Sie den Inhalt! Nur so können Sie im Rechtsstreit bestätigen, was Sie transportiert haben.' : null,
          hasMultipleDeliveries ? `📍 Multi-Stop-Auftrag: ${stopIndex + 1} von ${totalStops} Zustellungen` : null
        ].filter(Boolean).join(' | ') || 'Keine besonderen Vereinbarungen',
        carriage_charges_paid: true,
        carriage_charges_forward: false,
        cash_on_delivery: null,
      };
    };

    // Create CMR for main delivery (stop 0)
    const mainDeliveryInfo = {
      address: order.delivery_address,
      city: order.delivery_city,
      postal_code: order.delivery_postal_code,
      country: order.delivery_country,
      contact_name: order.delivery_contact_name,
      company: order.delivery_company
    };

    console.log(`   Creating CMR 1/${totalStops} (Main Delivery)`);
    const mainCMRData = createCMRData(mainDeliveryInfo, 0, true);
    const mainCMR = await CMR.create(mainCMRData);
    createdCMRs.push(mainCMR);

    // Create CMRs for additional delivery stops
    if (hasMultipleDeliveries) {
      for (let i = 0; i < deliveryStops.length; i++) {
        const stop = deliveryStops[i];
        console.log(`   Creating CMR ${i + 2}/${totalStops} (Additional Stop)`);
        
        const stopCMRData = createCMRData(stop, i + 1, false);
        const stopCMR = await CMR.create(stopCMRData);
        createdCMRs.push(stopCMR);
      }
    }

    console.log(`✅ Created ${createdCMRs.length} CMR document(s) for order ${orderId}`);

    // For now, only generate PDF for the first CMR (main delivery)
    // Combined PDF will be generated when all deliveries are completed
    const { filepath, filename } = await CMRPdfGenerator.generateCMR(mainCMR, order);
    const pdfUrl = `/uploads/cmr/${filename}`;
    await CMR.updatePdfUrl(mainCMR.id, pdfUrl);

    // Return all CMRs
    return {
      cmrs: createdCMRs,
      mainCMR: { ...mainCMR, pdf_url: pdfUrl },
      isMultiStop: hasMultipleDeliveries,
      totalStops: totalStops
    };
  } catch (error) {
    console.error('Error creating CMR:', error);
    throw error;
  }
};

const getCMRByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('📄 Fetching CMR for order:', orderId);
    
    // Check authorization first
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (
      req.user.role === 'customer' && order.customer_id !== req.user.id ||
      req.user.role === 'contractor' && order.contractor_id !== req.user.id
    ) {
      console.error('❌ Access denied for user:', req.user.id);
      return res.status(403).json({ error: 'Access denied' });
    }

    let cmr = await CMR.findByOrderId(orderId);
    
    // If CMR doesn't exist and order has a contractor, create it
    if (!cmr && order.contractor_id) {
      console.log('⚠️ CMR not found, creating it now for order:', orderId);
      try {
        cmr = await CMR.createFromOrder(orderId);
        console.log('✅ CMR created, ID:', cmr.id);
        
        // Generate PDF
        const CMRPdfGenerator = require('../services/cmrPdfGenerator');
        await CMRPdfGenerator.generateCMR(cmr, order);
        console.log('✅ CMR PDF generated');
      } catch (createError) {
        console.error('❌ Failed to create CMR:', createError.message);
        return res.status(500).json({ error: 'Failed to create CMR document' });
      }
    } else if (!cmr) {
      console.error('❌ CMR not found and no contractor assigned for order:', orderId);
      return res.status(404).json({ error: 'CMR document not found' });
    } else {
      console.log('✅ CMR found, ID:', cmr.id);
    }

    console.log('✅ Authorization passed, returning CMR');
    res.json({ cmr });
  } catch (error) {
    console.error('❌ Get CMR error:', error);
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
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
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
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
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
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
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
    const { senderName, senderSignature, carrierSignature, pickupWaitingMinutes, waitingNotes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('📦 Pickup confirmation started for order:', orderId);
    console.log('   User ID:', userId, 'Role:', userRole);
    console.log('   Pickup waiting time:', pickupWaitingMinutes, 'minutes');
    console.log('   Sender name:', senderName);
    console.log('   Has signatures:', !!senderSignature, !!carrierSignature);

    // Validate input
    if (!senderName || !senderSignature || !carrierSignature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify order belongs to this contractor OR employee
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check authorization: contractor owns order OR employee is assigned to order
    const pool = require('../config/database');
    if (userRole === 'employee') {
      // For employees, check if they belong to the contractor AND are assigned
      const employeeCheck = await pool.query(
        `SELECT u.contractor_id, o.assigned_employee_id 
         FROM users u, transport_orders o 
         WHERE u.id = $1 AND o.id = $2`,
        [userId, orderId]
      );
      
      if (employeeCheck.rows.length === 0 || 
          employeeCheck.rows[0].contractor_id !== order.contractor_id) {
        console.error('❌ Employee not authorized for this order');
        return res.status(403).json({ error: 'Unauthorized' });
      }
      console.log('✅ Employee authorized');
    } else if (order.contractor_id !== userId) {
      console.error('❌ Unauthorized access. Order contractor:', order.contractor_id, 'User:', userId);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log('✅ Order verified, status:', order.status);

    // Get or create CMR
    let cmr = await CMR.findByOrderId(orderId);
    if (!cmr) {
      console.log('📄 Creating new CMR for order:', orderId);
      cmr = await CMR.createFromOrder(orderId);
    }
    console.log('✅ CMR ready, ID:', cmr.id);

    // Get contractor ID from order (always reliable)
    const contractorId = order.contractor_id;
    console.log('   Contractor ID from order:', contractorId);
    
    const contractor = await User.findById(contractorId);
    if (!contractor) {
      console.error('❌ Contractor not found:', contractorId);
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    // Get user details for employee name
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Carrier name (Feld 16): Always the company/contractor name
    const carrierName = contractor.company_name || `${contractor.first_name} ${contractor.last_name}`;
    
    // Carrier signed by (Feld 23): ALWAYS the human name of the person executing
    // - If employee: Employee's name
    // - If contractor himself: Contractor's personal name (NOT company name)
    const carrierSignedBy = userRole === 'employee' 
      ? `${user.first_name} ${user.last_name}`  // Employee name
      : `${contractor.first_name} ${contractor.last_name}`;  // Contractor's personal name
    
    console.log('💾 Updating CMR with signatures...');
    console.log('   Carrier company:', carrierName);
    console.log('   Signed by:', carrierSignedBy);
    
    // First, ensure the carrier_signed_by column exists
    try {
      await pool.query(`
        ALTER TABLE cmr_documents 
        ADD COLUMN IF NOT EXISTS carrier_signed_by VARCHAR(255)
      `);
    } catch (alterError) {
      console.log('⚠️ Column might already exist:', alterError.message);
    }
    
    await pool.query(
      `UPDATE cmr_documents 
       SET sender_signed_name = $1,
           sender_signature = $2,
           sender_signed_at = CURRENT_TIMESTAMP,
           carrier_name = $3,
           carrier_signature = $4,
           carrier_signed_at = CURRENT_TIMESTAMP,
           carrier_signed_by = $6
       WHERE id = $5`,
      [
        senderName,
        senderSignature,
        carrierName,
        carrierSignature,
        cmr.id,
        carrierSignedBy
      ]
    );
    console.log('✅ CMR signatures saved');

    // Update order with waiting time if provided
    if (pickupWaitingMinutes && pickupWaitingMinutes > 0) {
      console.log('⏱️ Saving pickup waiting time...');
      await pool.query(
        `UPDATE transport_orders 
         SET pickup_waiting_minutes = $1,
             pickup_waiting_notes = $2
         WHERE id = $3`,
        [pickupWaitingMinutes, waitingNotes || null, orderId]
      );
      console.log(`✅ Pickup waiting time saved: ${pickupWaitingMinutes} minutes`);
    }

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
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
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
    const { receiverName, receiverSignature, deliveryPhoto, deliveryWaitingMinutes, waitingNotes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('📦 Delivery confirmation started for order:', orderId);
    console.log('User ID:', userId, 'Role:', userRole);
    console.log('Delivery waiting time:', deliveryWaitingMinutes, 'minutes');
    console.log('📸 Delivery photo received:', deliveryPhoto ? `YES (${deliveryPhoto.length} chars)` : 'NO');

    // Verify order belongs to this contractor OR employee
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check authorization
    const pool = require('../config/database');
    if (userRole === 'employee') {
      const employeeCheck = await pool.query(
        `SELECT u.contractor_id 
         FROM users u 
         WHERE u.id = $1`,
        [userId]
      );
      
      if (employeeCheck.rows.length === 0 || 
          employeeCheck.rows[0].contractor_id !== order.contractor_id) {
        console.error('❌ Employee not authorized for this order');
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (order.contractor_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get CMR
    const cmr = await CMR.findByOrderId(orderId);
    if (!cmr) {
      return res.status(404).json({ error: 'CMR not found' });
    }

    // Update CMR with receiver signature and optional photo
    await pool.query(
      `UPDATE cmr_documents 
       SET consignee_signed_name = $1,
           consignee_signature = $2,
           consignee_signed_at = CURRENT_TIMESTAMP,
           consignee_photo = $4
       WHERE id = $3`,
      [receiverName, receiverSignature, cmr.id, deliveryPhoto || null]
    );
    console.log('✅ Receiver signature saved' + (deliveryPhoto ? ' with photo' : ''));

    // Update order with delivery waiting time if provided
    if (deliveryWaitingMinutes && deliveryWaitingMinutes > 0) {
      console.log('⏱️ Saving delivery waiting time...');
      await pool.query(
        `UPDATE transport_orders 
         SET delivery_waiting_minutes = $1,
             delivery_waiting_notes = $2
         WHERE id = $3`,
        [deliveryWaitingMinutes, waitingNotes || null, orderId]
      );
      console.log(`✅ Delivery waiting time saved: ${deliveryWaitingMinutes} minutes`);
    }

    // Calculate total waiting time and fee
    // IMPORTANT: The 30 minutes free allowance applies to the TOTAL waiting time, not per location
    const totalPickupWaiting = order.pickup_waiting_minutes || 0;
    const totalDeliveryWaiting = parseInt(deliveryWaitingMinutes) || 0;
    const totalWaitingMinutes = totalPickupWaiting + totalDeliveryWaiting;
    
    let waitingTimeFee = 0;
    if (totalWaitingMinutes > 30) {
      const chargeableMinutes = totalWaitingMinutes - 30; // Subtract 30 min free allowance from TOTAL
      const blocks = Math.ceil(chargeableMinutes / 5); // Round up to nearest 5-minute block
      waitingTimeFee = blocks * 3; // €3 per 5-minute block
      console.log(`⏱️ Total waiting time: ${totalWaitingMinutes} min (Pickup: ${totalPickupWaiting}, Delivery: ${totalDeliveryWaiting})`);
      console.log(`⏱️ Chargeable: ${chargeableMinutes} min (${blocks} blocks × €3) = €${waitingTimeFee}`);
    } else {
      console.log(`⏱️ Total waiting time: ${totalWaitingMinutes} min - within free 30 min allowance`);
    }

    // Check if this is a multi-stop order and if all stops are completed
    const cmrGroupId = `ORDER-${orderId}`;
    const allCMRs = await CMR.findByGroupId(cmrGroupId);
    const isMultiStop = allCMRs.length > 1;
    
    let allStopsCompleted = false;
    if (isMultiStop) {
      // Check if all CMRs have signatures or photos
      allStopsCompleted = allCMRs.every(cmr => 
        cmr.consignee_signature || cmr.delivery_photo_base64 || cmr.shared_receiver_signature
      );
      console.log(`📦 Multi-Stop Order: ${allCMRs.length} stops, all completed: ${allStopsCompleted}`);
    } else {
      allStopsCompleted = true; // Single stop is always "all completed"
    }
    
    // Update order status based on waiting time and completion
    let newStatus = allStopsCompleted ? 'completed' : 'picked_up';
    
    if (allStopsCompleted && waitingTimeFee > 0) {
      newStatus = 'pending_approval'; // Needs admin approval for waiting time fee
      console.log('📊 Order requires admin approval for waiting time fee');
      
      await pool.query(
        `UPDATE transport_orders 
         SET status = $1,
             waiting_time_fee = $2
         WHERE id = $3`,
        [newStatus, waitingTimeFee, orderId]
      );
    } else if (allStopsCompleted) {
      await Order.updateStatus(orderId, 'completed');
    } else {
      console.log(`⏸️ Not all stops completed yet - keeping status as 'picked_up'`);
    }
    
    console.log(`✅ Order status updated to: ${newStatus}`);

    // Only send email and generate PDF if all stops are completed
    if (!allStopsCompleted) {
      console.log(`📧 Skipping email - not all stops completed yet`);
      return res.json({ 
        success: true, 
        message: 'Zustellung bestätigt. Weitere Stops ausstehend.',
        allStopsCompleted: false,
        nextCMR: await CMR.getNextPendingDelivery(cmrGroupId)
      });
    }
    
    // All stops completed - generate combined PDF and send email
    console.log('📄 All stops completed - generating combined PDF...');
    
    let pdfGenerated = false;
    let pdfPath = null;
    
    try {
      if (isMultiStop) {
        // Generate combined PDF with all CMRs
        const MultiStopPdfGenerator = require('../services/multiStopPdfGenerator');
        const { filepath, filename } = await MultiStopPdfGenerator.generateCombinedPDF(orderId, cmrGroupId);
        pdfPath = filepath;
        console.log('✅ Combined PDF generated:', filename);
        pdfGenerated = true;
      } else {
        // Single stop - generate regular CMR PDF
        const updatedCmr = await CMR.findByOrderId(orderId);
        await CMRPdfGenerator.generateCMR(updatedCmr, order);
        pdfPath = require('path').join(__dirname, '../../uploads/cmr', `cmr_${orderId}.pdf`);
        console.log('✅ CMR PDF generated');
        pdfGenerated = true;
      }
    } catch (pdfError) {
      console.error('⚠️ PDF generation failed:', pdfError);
      console.error('   Error stack:', pdfError.stack);
    }

    // Send email to customer with CMR
    try {
      const customer = await User.findById(order.customer_id);
      
      // Get contractor ID (from order or from employee's contractor)
      const contractorId = order.contractor_id;
      const contractor = await User.findById(contractorId);
      
      // Read PDF file (combined or single CMR)
      const fs = require('fs');
      console.log('   Looking for PDF at:', pdfPath);
      
      let attachments = [];
      if (pdfPath && fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        const filename = isMultiStop 
          ? `CMR_MultiStop_Auftrag_${orderId}.pdf`
          : `CMR_Auftrag_${orderId}.pdf`;
        
        attachments = [{
          filename,
          content: pdfBase64,
        }];
        console.log('📎 PDF attached to email (size:', pdfBuffer.length, 'bytes)');
      } else {
        console.log('⚠️ PDF not found at:', pdfPath);
        console.log('   PDF was generated:', pdfGenerated);
      }
      
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
            
            <p style="margin-top: 30px;">Vielen Dank für Ihr Vertrauen!<br>Ihr Courierly Team</p>
          </div>
        `,
        attachments
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error while confirming delivery',
      details: error.message 
    });
  }
};

// Get all CMRs for a multi-stop order
const getCMRsByGroupId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const cmrGroupId = `ORDER-${orderId}`;
    
    const cmrs = await CMR.findByGroupId(cmrGroupId);
    
    if (!cmrs || cmrs.length === 0) {
      return res.status(404).json({ error: 'No CMRs found for this order' });
    }
    
    res.json({ 
      cmrs,
      isMultiStop: cmrs[0].is_multi_stop,
      totalStops: cmrs[0].total_stops,
      canShareSenderSignature: cmrs[0].can_share_sender_signature,
      canShareReceiverSignature: cmrs[0].can_share_receiver_signature
    });
  } catch (error) {
    console.error('Error getting CMRs by group:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get next pending delivery for multi-stop order
const getNextPendingDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const cmrGroupId = `ORDER-${orderId}`;
    
    const nextCMR = await CMR.getNextPendingDelivery(cmrGroupId);
    
    if (!nextCMR) {
      // All deliveries completed
      const isCompleted = await CMR.isGroupCompleted(cmrGroupId);
      return res.json({ 
        completed: true,
        allDeliveriesCompleted: isCompleted
      });
    }
    
    res.json({ 
      completed: false,
      nextDelivery: nextCMR
    });
  } catch (error) {
    console.error('Error getting next pending delivery:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update shared signatures for all CMRs in a group
const updateSharedSignatures = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { senderSignature, carrierSignature } = req.body;
    const cmrGroupId = `ORDER-${orderId}`;
    
    if (!senderSignature && !carrierSignature) {
      return res.status(400).json({ error: 'At least one signature required' });
    }
    
    const updatedCMRs = await CMR.updateSharedSignatures(
      cmrGroupId,
      senderSignature || null,
      carrierSignature || null
    );
    
    res.json({ 
      message: 'Shared signatures updated',
      updatedCount: updatedCMRs.length
    });
  } catch (error) {
    console.error('Error updating shared signatures:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update delivery photo for specific CMR
const updateDeliveryPhoto = async (req, res) => {
  try {
    const { cmrId } = req.params;
    const { photoBase64 } = req.body;
    
    if (!photoBase64) {
      return res.status(400).json({ error: 'Photo required' });
    }
    
    const updatedCMR = await CMR.updateDeliveryPhoto(cmrId, photoBase64);
    
    if (!updatedCMR) {
      return res.status(404).json({ error: 'CMR not found' });
    }
    
    res.json({ 
      message: 'Delivery photo updated',
      cmr: updatedCMR
    });
  } catch (error) {
    console.error('Error updating delivery photo:', error);
    res.status(500).json({ error: 'Server error' });
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
  getCMRsByGroupId,
  getNextPendingDelivery,
  updateSharedSignatures,
  updateDeliveryPhoto,
};
