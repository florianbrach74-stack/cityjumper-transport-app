const pool = require('../config/database');

class Order {
  static async create(orderData) {
    const {
      customer_id,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      pickup_country,
      pickup_company,
      pickup_date,
      pickup_time,
      pickup_contact_name,
      pickup_contact_phone,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country,
      delivery_company,
      delivery_date,
      delivery_time,
      delivery_contact_name,
      delivery_contact_phone,
      vehicle_type,
      weight,
      length,
      width,
      height,
      pallets,
      description,
      special_requirements,
      price,
    } = orderData;

    // Calculate contractor price (85% of customer price, 15% platform commission)
    const contractorPrice = price ? Math.round(price * 0.85 * 100) / 100 : null;

    const query = `
      INSERT INTO transport_orders (
        customer_id, pickup_address, pickup_city, pickup_postal_code, pickup_country, pickup_company,
        pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_postal_code, delivery_country, delivery_company,
        delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone,
        vehicle_type, weight, length, width, height, pallets, description,
        special_requirements, price, contractor_price, distance_km, duration_minutes, route_geometry, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, 'pending'
      ) RETURNING *
    `;

    const values = [
      customer_id, pickup_address, pickup_city, pickup_postal_code, pickup_country || 'Deutschland', pickup_company || null,
      pickup_date, pickup_time, pickup_contact_name, pickup_contact_phone,
      delivery_address, delivery_city, delivery_postal_code, delivery_country || 'Deutschland', delivery_company || null,
      delivery_date, delivery_time, delivery_contact_name, delivery_contact_phone,
      vehicle_type, weight, length, width, height, pallets, description,
      special_requirements, price, contractorPrice, orderData.distance_km, orderData.duration_minutes, orderData.route_geometry || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT o.*, 
        c.email as customer_email, c.first_name as customer_first_name, 
        c.last_name as customer_last_name, c.company_name as customer_company,
        ct.email as contractor_email, ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name, ct.company_name as contractor_company
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT o.*, 
        c.email as customer_email, c.first_name as customer_first_name, 
        c.last_name as customer_last_name, c.company_name as customer_company,
        ct.email as contractor_email, ct.first_name as contractor_first_name,
        ct.last_name as contractor_last_name, ct.company_name as contractor_company
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users ct ON o.contractor_id = ct.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND o.status = $${paramCount}`;
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

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async acceptOrder(orderId, contractorId) {
    const query = `
      UPDATE transport_orders
      SET contractor_id = $1, status = 'accepted', accepted_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `;
    const result = await pool.query(query, [contractorId, orderId]);
    return result.rows[0];
  }

  static async updateStatus(orderId, status) {
    const query = `
      UPDATE transport_orders
      SET status = $1::varchar, 
          picked_up_at = CASE WHEN $1::varchar = 'picked_up' THEN CURRENT_TIMESTAMP ELSE picked_up_at END,
          delivered_at = CASE WHEN $1::varchar = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
          completed_at = CASE WHEN $1::varchar = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, orderId]);
    if (result.rows.length === 0) {
      throw new Error('Order not found or could not be updated');
    }
    return result.rows[0];
  }

  static async getAvailableOrders() {
    const query = `
      SELECT o.*, 
        c.email as customer_email, c.first_name as customer_first_name, 
        c.last_name as customer_last_name, c.company_name as customer_company
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Order;
