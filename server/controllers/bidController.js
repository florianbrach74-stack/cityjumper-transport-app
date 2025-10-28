const OrderBid = require('../models/OrderBid');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail } = require('../config/email');

// Contractor applies for an order
const createBid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { bidAmount, message } = req.body;
    const contractorId = req.user.id;

    // Check if contractor is verified
    const contractorUser = await User.findById(contractorId);
    console.log('Contractor verification status:', contractorUser.verification_status);
    
    if (contractorUser.verification_status !== 'approved') {
      return res.status(403).json({ 
        error: 'Ihr Account muss erst verifiziert werden, bevor Sie sich auf Aufträge bewerben können',
        verification_status: contractorUser.verification_status
      });
    }

    // Check if order exists and is still pending
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is no longer available' });
    }

    // Check if contractor already applied
    const existingBid = await OrderBid.checkExistingBid(orderId, contractorId);
    if (existingBid) {
      return res.status(400).json({ error: 'You have already applied for this order' });
    }

    // Calculate max bid (85% of customer price)
    const maxBid = order.price * 0.85;
    if (bidAmount > maxBid) {
      return res.status(400).json({ 
        error: `Bid amount cannot exceed ${maxBid.toFixed(2)}€ (85% of customer price)` 
      });
    }

    // Create bid
    const bid = await OrderBid.create(orderId, contractorId, bidAmount, message);

    // Send notification to admin
    const admins = await User.findByRole('admin');
    const contractor = await User.findById(contractorId);
    
    for (const admin of admins) {
      await sendEmail(
        admin.email,
        '🎯 Neue Bewerbung für Auftrag',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Neue Bewerbung eingegangen</h2>
            <p>Hallo ${admin.first_name},</p>
            <p>Ein Auftragnehmer hat sich für einen Auftrag beworben.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Bewerbungs-Details:</h3>
              <p><strong>Auftrag:</strong> #${order.id}</p>
              <p><strong>Route:</strong> ${order.pickup_city} → ${order.delivery_city}</p>
              <p><strong>Auftragnehmer:</strong> ${contractor.company_name || contractor.first_name + ' ' + contractor.last_name}</p>
              <p><strong>Gebotener Preis:</strong> €${bidAmount}</p>
              <p><strong>Kundenpreis:</strong> €${order.price}</p>
              <p><strong>Ihre Marge:</strong> €${(order.price - bidAmount).toFixed(2)}</p>
              ${message ? `<p><strong>Nachricht:</strong> ${message}</p>` : ''}
            </div>
            
            <p>Bitte prüfen Sie die Bewerbung im Admin-Dashboard.</p>
            
            <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr CityJumper System</p>
          </div>
        `
      );
    }

    res.status(201).json({
      message: 'Bid submitted successfully',
      bid,
    });
  } catch (error) {
    console.error('Create bid error:', error);
    res.status(500).json({ error: 'Server error while submitting bid' });
  }
};

// Get bids for an order (admin only)
const getBidsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const bids = await OrderBid.findByOrderId(orderId);
    res.json({ bids });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Server error while fetching bids' });
  }
};

// Get contractor's own bids
const getMyBids = async (req, res) => {
  try {
    const bids = await OrderBid.findByContractorId(req.user.id);
    res.json({ bids });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ error: 'Server error while fetching bids' });
  }
};

// Accept a bid (admin only)
const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    
    const bid = await OrderBid.acceptBid(bidId);
    const order = await Order.findById(bid.order_id);
    const contractor = await User.findById(bid.contractor_id);
    const customer = await User.findById(order.customer_id);

    // Create CMR document automatically
    const CMR = require('../models/CMR');
    const CMRPdfGenerator = require('../utils/cmrPdfGenerator');
    
    try {
      const cmr = await CMR.create(order.id);
      await CMRPdfGenerator.generateCMR(cmr, order);
      console.log(`✅ CMR document created for order #${order.id}`);
    } catch (cmrError) {
      console.error('Error creating CMR:', cmrError);
      // Don't fail the bid acceptance if CMR creation fails
    }

    // Send email to contractor
    await sendEmail(
      contractor.email,
      '🎉 Auftrag zugewiesen - Ihre Bewerbung wurde akzeptiert',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Glückwunsch! Auftrag zugewiesen</h2>
          <p>Hallo ${contractor.first_name} ${contractor.last_name},</p>
          <p>Ihre Bewerbung wurde akzeptiert. Der Auftrag wurde Ihnen zugewiesen.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Auftrags-Details:</h3>
            <p><strong>Auftrag:</strong> #${order.id}</p>
            <p><strong>Abholung:</strong> ${order.pickup_address}, ${order.pickup_city}</p>
            <p><strong>Zustellung:</strong> ${order.delivery_address}, ${order.delivery_city}</p>
            <p><strong>Datum:</strong> ${new Date(order.pickup_date).toLocaleDateString('de-DE')}</p>
            <p><strong>Ihr Preis:</strong> €${bid.bid_amount}</p>
          </div>
          
          <p>Sie können den Auftrag jetzt in Ihrem Dashboard sehen.</p>
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr CityJumper Team</p>
        </div>
      `
    );

    res.json({
      message: 'Bid accepted successfully',
      bid,
    });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ error: 'Server error while accepting bid' });
  }
};

// Reject a bid (admin only)
const rejectBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const bid = await OrderBid.rejectBid(bidId);
    
    res.json({
      message: 'Bid rejected successfully',
      bid,
    });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ error: 'Server error while rejecting bid' });
  }
};

module.exports = {
  createBid,
  getBidsForOrder,
  getMyBids,
  acceptBid,
  rejectBid,
};
