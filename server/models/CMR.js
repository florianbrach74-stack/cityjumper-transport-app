const pool = require('../config/database');

class CMR {
  static async create(cmrData) {
    const {
      order_id,
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
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, 'created'
      ) RETURNING *
    `;

    const values = [
      order_id, cmr_number,
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

  static async addSignature(cmrId, signatureType, signatureData, location, remarks = null) {
    let query;
    const timestamp = new Date();

    switch (signatureType) {
      case 'sender':
        query = `
          UPDATE cmr_documents
          SET sender_signature = $1, sender_signed_at = $2, sender_signature_location = $3
          WHERE id = $4
          RETURNING *
        `;
        break;
      case 'carrier':
        query = `
          UPDATE cmr_documents
          SET carrier_signature = $1, carrier_signed_at = $2, carrier_signature_location = $3, status = 'in_transit'
          WHERE id = $4
          RETURNING *
        `;
        break;
      case 'consignee':
        query = `
          UPDATE cmr_documents
          SET consignee_signature = $1, consignee_signed_at = $2, 
              consignee_signature_location = $3, consignee_remarks = $4,
              status = 'signed', delivered_at = $2
          WHERE id = $5
          RETURNING *
        `;
        if (remarks) {
          const result = await pool.query(query, [signatureData, timestamp, location, remarks, cmrId]);
          return result.rows[0];
        }
        break;
      default:
        throw new Error('Invalid signature type');
    }

    const result = await pool.query(query, [signatureData, timestamp, location, cmrId]);
    return result.rows[0];
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
}

module.exports = CMR;
