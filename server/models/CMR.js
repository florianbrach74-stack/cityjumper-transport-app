const pool = require('../config/database');

class CMR {
  static async create(cmrData) {
    const {
      order_id,
      cmr_group_id,
      delivery_stop_index,
      total_stops,
      is_multi_stop,
      can_share_sender_signature,
      can_share_receiver_signature,
      sender_name,
      sender_address,
      sender_city,
      sender_postal_code,
      sender_country,
      consignee_name,
      consignee_address,
      consignee_city,
      consignee_postal_code,
      consignee_country,
      carrier_name,
      carrier_address,
      carrier_city,
      carrier_postal_code,
      place_of_loading,
      place_of_delivery,
      documents_attached,
      goods_description,
      number_of_packages,
      method_of_packing,
      marks_and_numbers,
      gross_weight,
      volume,
      special_agreements,
      carriage_charges_paid,
      carriage_charges_forward,
      cash_on_delivery,
    } = cmrData;

    // Generate CMR number
    const cmrNumberResult = await pool.query('SELECT generate_cmr_number() as cmr_number');
    const cmr_number = cmrNumberResult.rows[0].cmr_number;

    const query = `
      INSERT INTO cmr_documents (
        order_id, cmr_number,
        cmr_group_id, delivery_stop_index, total_stops, is_multi_stop,
        can_share_sender_signature, can_share_receiver_signature,
        sender_name, sender_address, sender_city, sender_postal_code, sender_country,
        consignee_name, consignee_address, consignee_city, consignee_postal_code, consignee_country,
        carrier_name, carrier_address, carrier_city, carrier_postal_code,
        place_of_loading, place_of_delivery, documents_attached,
        goods_description, number_of_packages, method_of_packing, marks_and_numbers,
        gross_weight, volume, special_agreements,
        carriage_charges_paid, carriage_charges_forward, cash_on_delivery,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, 'created'
      ) RETURNING *
    `;

    const values = [
      order_id, cmr_number,
      cmr_group_id || `ORDER-${order_id}`,
      delivery_stop_index || 0,
      total_stops || 1,
      is_multi_stop || false,
      can_share_sender_signature !== undefined ? can_share_sender_signature : true,
      can_share_receiver_signature !== undefined ? can_share_receiver_signature : false,
      sender_name, sender_address, sender_city, sender_postal_code, sender_country,
      consignee_name, consignee_address, consignee_city, consignee_postal_code, consignee_country,
      carrier_name, carrier_address, carrier_city, carrier_postal_code,
      place_of_loading, place_of_delivery, documents_attached,
      goods_description, number_of_packages, method_of_packing, marks_and_numbers,
      gross_weight, volume, special_agreements,
      carriage_charges_paid, carriage_charges_forward, cash_on_delivery,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM cmr_documents WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create CMR from order ID only (gets data from order)
  static async createFromOrder(orderId) {
    // Get order data
    const orderResult = await pool.query('SELECT * FROM transport_orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Generate CMR number
    const cmrNumberResult = await pool.query('SELECT generate_cmr_number() as cmr_number');
    const cmr_number = cmrNumberResult.rows[0].cmr_number;

    // Get contractor data for carrier info
    const contractorResult = await pool.query('SELECT * FROM users WHERE id = $1', [order.contractor_id]);
    const contractor = contractorResult.rows[0];

    const query = `
      INSERT INTO cmr_documents (
        order_id, cmr_number,
        sender_name, sender_address, sender_city, sender_postal_code, sender_country,
        consignee_name, consignee_address, consignee_city, consignee_postal_code, consignee_country,
        carrier_name,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'created'
      )
      RETURNING *
    `;

    const values = [
      orderId,
      cmr_number,
      // Sender (from pickup)
      order.pickup_contact_name || 'Absender',
      order.pickup_address,
      order.pickup_city,
      order.pickup_postal_code,
      'Deutschland',
      // Consignee (from delivery)
      order.delivery_contact_name || 'Empfänger',
      order.delivery_address,
      order.delivery_city,
      order.delivery_postal_code,
      'Deutschland',
      // Carrier
      contractor ? (contractor.company_name || `${contractor.first_name} ${contractor.last_name}`) : 'Frachtführer'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM cmr_documents WHERE order_id = $1';
    const result = await pool.query(query, [orderId]);
    return result.rows[0];
  }

  static async findByCMRNumber(cmrNumber) {
    const query = 'SELECT * FROM cmr_documents WHERE cmr_number = $1';
    const result = await pool.query(query, [cmrNumber]);
    return result.rows[0];
  }

  static async addSignature(cmrId, signatureType, signatureData, location, remarks = null, consigneeName = null, photoUrl = null) {
    let query;
    const timestamp = new Date();

    switch (signatureType) {
      case 'sender':
        query = `
          UPDATE cmr_documents
          SET sender_signature = $1, sender_signed_at = $2, sender_signature_location = $3, 
              sender_signed_name = $4, sender_signer_name = $4
          WHERE id = $5
          RETURNING *
        `;
        const senderResult = await pool.query(query, [signatureData, timestamp, location, consigneeName || '', cmrId]);
        return senderResult.rows[0];
      case 'carrier':
        query = `
          UPDATE cmr_documents
          SET carrier_signature = $1, carrier_signed_at = $2, carrier_signature_location = $3, carrier_signed_name = $4, status = 'in_transit'
          WHERE id = $5
          RETURNING *
        `;
        const carrierResult = await pool.query(query, [signatureData, timestamp, location, consigneeName || '', cmrId]);
        return carrierResult.rows[0];
      case 'consignee':
        // Support both signature and photo (for Briefkasten delivery)
        query = `
          UPDATE cmr_documents
          SET consignee_signature = $1, consignee_signed_at = $2, 
              consignee_signature_location = $3, consignee_remarks = $4,
              consignee_signed_name = $5, consignee_signer_name = $5, consignee_photo = $6,
              status = 'signed', delivered_at = $2
          WHERE id = $7
          RETURNING *
        `;
        const result = await pool.query(query, [
          signatureData || null, 
          timestamp, 
          location, 
          remarks || '', 
          consigneeName || '', 
          photoUrl || null, 
          cmrId
        ]);
        return result.rows[0];
      default:
        throw new Error('Invalid signature type');
    }
  }

  static async updateStatus(cmrId, status) {
    const query = `
      UPDATE cmr_documents
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, cmrId]);
    return result.rows[0];
  }

  static async updatePdfUrl(cmrId, pdfUrl) {
    const query = `
      UPDATE cmr_documents
      SET pdf_url = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [pdfUrl, cmrId]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT c.*, o.customer_id, o.contractor_id
      FROM cmr_documents c
      LEFT JOIN transport_orders o ON c.order_id = o.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND c.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.customer_id) {
      query += ` AND o.customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters.contractor_id) {
      query += ` AND o.contractor_id = $${paramCount}`;
      values.push(filters.contractor_id);
      paramCount++;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get all CMRs for a group (multi-stop order)
  static async findByGroupId(cmrGroupId) {
    const query = `
      SELECT * FROM cmr_documents 
      WHERE cmr_group_id = $1 
      ORDER BY delivery_stop_index ASC
    `;
    const result = await pool.query(query, [cmrGroupId]);
    return result.rows;
  }

  // Update shared signatures for all CMRs in a group
  static async updateSharedSignatures(cmrGroupId, senderSignature, carrierSignature) {
    const query = `
      UPDATE cmr_documents 
      SET shared_sender_signature = $1,
          shared_carrier_signature = $2
      WHERE cmr_group_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [senderSignature, carrierSignature, cmrGroupId]);
    return result.rows;
  }

  // Update delivery photo for specific CMR
  static async updateDeliveryPhoto(cmrId, photoBase64) {
    const query = `
      UPDATE cmr_documents 
      SET delivery_photo_base64 = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [photoBase64, cmrId]);
    return result.rows[0];
  }

  // Get next pending delivery in a multi-stop order
  static async getNextPendingDelivery(cmrGroupId) {
    const query = `
      SELECT * FROM cmr_documents 
      WHERE cmr_group_id = $1 
        AND consignee_signature IS NULL
      ORDER BY delivery_stop_index ASC
      LIMIT 1
    `;
    const result = await pool.query(query, [cmrGroupId]);
    return result.rows[0];
  }

  // Check if all deliveries in group are completed
  static async isGroupCompleted(cmrGroupId) {
    const query = `
      SELECT COUNT(*) as total,
             COUNT(consignee_signature) as completed
      FROM cmr_documents 
      WHERE cmr_group_id = $1
    `;
    const result = await pool.query(query, [cmrGroupId]);
    const { total, completed } = result.rows[0];
    return parseInt(total) === parseInt(completed);
  }
}

module.exports = CMR;
