const pool = require('../config/database');

class OrderBid {
  static async create(orderId, contractorId, bidAmount, message = null) {
    const query = `
      INSERT INTO order_bids (order_id, contractor_id, bid_amount, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [orderId, contractorId, bidAmount, message]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = `
      SELECT ob.*, 
        u.first_name as contractor_first_name,
        u.last_name as contractor_last_name,
        u.company_name as contractor_company,
        u.email as contractor_email
      FROM order_bids ob
      LEFT JOIN users u ON ob.contractor_id = u.id
      WHERE ob.order_id = $1
      ORDER BY ob.bid_amount ASC, ob.created_at ASC
    `;
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async findByContractorId(contractorId) {
    const query = `
      SELECT ob.*, 
        o.pickup_city, o.delivery_city, o.pickup_date, o.vehicle_type,
        o.status as order_status, o.price as customer_price
      FROM order_bids ob
      LEFT JOIN transport_orders o ON ob.order_id = o.id
      WHERE ob.contractor_id = $1
      ORDER BY ob.created_at DESC
    `;
    const result = await pool.query(query, [contractorId]);
    return result.rows;
  }

  static async findById(bidId) {
    const query = 'SELECT * FROM order_bids WHERE id = $1';
    const result = await pool.query(query, [bidId]);
    return result.rows[0];
  }

  static async acceptBid(bidId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get bid details
      const bidResult = await client.query('SELECT * FROM order_bids WHERE id = $1', [bidId]);
      const bid = bidResult.rows[0];

      if (!bid) {
        throw new Error('Bid not found');
      }

      // Update bid status to accepted
      await client.query(
        'UPDATE order_bids SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['accepted', bidId]
      );

      // Reject all other bids for this order
      await client.query(
        'UPDATE order_bids SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND id != $3',
        ['rejected', bid.order_id, bidId]
      );

      // Assign order to contractor and update price
      await client.query(
        `UPDATE transport_orders 
         SET contractor_id = $1, status = 'accepted', price = $2, accepted_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [bid.contractor_id, bid.bid_amount, bid.order_id]
      );

      await client.query('COMMIT');
      return bid;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async rejectBid(bidId) {
    const query = `
      UPDATE order_bids 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [bidId]);
    return result.rows[0];
  }

  static async checkExistingBid(orderId, contractorId) {
    const query = 'SELECT * FROM order_bids WHERE order_id = $1 AND contractor_id = $2';
    const result = await pool.query(query, [orderId, contractorId]);
    return result.rows[0];
  }
}

module.exports = OrderBid;
