const pool = require('../config/database');

class Invoice {
  /**
   * Create a new invoice with multiple orders
   */
  static async create({ customerId, orderIds, notes, createdBy, dueDate }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get invoice number
      const invoiceNumberResult = await client.query('SELECT generate_invoice_number() as number');
      const invoiceNumber = invoiceNumberResult.rows[0].number;
      
      // Get orders and calculate totals
      const ordersResult = await client.query(
        `SELECT o.*, u.company_name, u.first_name, u.last_name, u.email
         FROM orders o
         JOIN users u ON o.customer_id = u.id
         WHERE o.id = ANY($1) AND o.customer_id = $2 AND o.status = 'completed'`,
        [orderIds, customerId]
      );
      
      if (ordersResult.rows.length === 0) {
        throw new Error('Keine abgeschlossenen Aufträge gefunden');
      }
      
      if (ordersResult.rows.length !== orderIds.length) {
        throw new Error('Einige Aufträge konnten nicht gefunden werden oder gehören nicht zum Kunden');
      }
      
      // Calculate totals
      let subtotal = 0;
      const orders = ordersResult.rows;
      
      orders.forEach(order => {
        subtotal += parseFloat(order.price || 0);
      });
      
      const taxRate = 19.00;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;
      
      // Set due date (default: 14 days from now)
      const dueDateValue = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number, customer_id, due_date, subtotal, 
          tax_rate, tax_amount, total_amount, notes, created_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
        RETURNING *`,
        [invoiceNumber, customerId, dueDateValue, subtotal, taxRate, taxAmount, totalAmount, notes, createdBy]
      );
      
      const invoice = invoiceResult.rows[0];
      
      // Create invoice items
      for (const order of orders) {
        const description = `Auftrag #${order.id} - ${order.pickup_address} → ${order.delivery_address} (${new Date(order.created_at).toLocaleDateString('de-DE')})`;
        
        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, order_id, description, quantity, unit_price, total_price
          )
          VALUES ($1, $2, $3, 1, $4, $4)`,
          [invoice.id, order.id, description, order.price]
        );
        
        // Update order with invoice_id
        await client.query(
          'UPDATE orders SET invoice_id = $1 WHERE id = $2',
          [invoice.id, order.id]
        );
      }
      
      await client.query('COMMIT');
      
      return await this.findById(invoice.id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find invoice by ID with all items
   */
  static async findById(invoiceId) {
    const invoiceResult = await pool.query(
      `SELECT i.*, 
              u.company_name, u.first_name, u.last_name, u.email,
              u.address, u.city, u.postal_code
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       WHERE i.id = $1`,
      [invoiceId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return null;
    }
    
    const invoice = invoiceResult.rows[0];
    
    // Get invoice items
    const itemsResult = await pool.query(
      `SELECT ii.*, o.pickup_address, o.delivery_address, o.created_at as order_date
       FROM invoice_items ii
       JOIN orders o ON ii.order_id = o.id
       WHERE ii.invoice_id = $1
       ORDER BY ii.id`,
      [invoiceId]
    );
    
    invoice.items = itemsResult.rows;
    
    return invoice;
  }
  
  /**
   * Get all invoices with pagination
   */
  static async getAll({ page = 1, limit = 20, status, customerId }) {
    let query = `
      SELECT i.*, 
             u.company_name, u.first_name, u.last_name, u.email,
             COUNT(ii.id) as item_count
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (customerId) {
      query += ` AND i.customer_id = $${paramCount}`;
      params.push(customerId);
      paramCount++;
    }
    
    query += `
      GROUP BY i.id, u.company_name, u.first_name, u.last_name, u.email
      ORDER BY i.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, (page - 1) * limit);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM invoices WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;
    
    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    
    if (customerId) {
      countQuery += ` AND customer_id = $${countParamCount}`;
      countParams.push(customerId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      invoices: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Update invoice status
   */
  static async updateStatus(invoiceId, status) {
    const updates = { status };
    
    if (status === 'sent') {
      updates.sent_at = new Date();
    } else if (status === 'paid') {
      updates.paid_at = new Date();
    }
    
    const setClause = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`).join(', ');
    const values = [invoiceId, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE invoices SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
  
  /**
   * Update PDF URL
   */
  static async updatePdfUrl(invoiceId, pdfUrl) {
    const result = await pool.query(
      'UPDATE invoices SET pdf_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [pdfUrl, invoiceId]
    );
    
    return result.rows[0];
  }
  
  /**
   * Delete invoice
   */
  static async delete(invoiceId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove invoice_id from orders
      await client.query('UPDATE orders SET invoice_id = NULL WHERE invoice_id = $1', [invoiceId]);
      
      // Delete invoice (items will be deleted by CASCADE)
      await client.query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
      
      await client.query('COMMIT');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Invoice;
