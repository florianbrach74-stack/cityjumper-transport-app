const pool = require('../config/database');

class SavedRoute {
  // Get all saved routes for a customer
  static async findByCustomerId(customerId) {
    const query = `
      SELECT * FROM saved_routes 
      WHERE customer_id = $1 
      ORDER BY usage_count DESC, route_name ASC
    `;
    const result = await pool.query(query, [customerId]);
    return result.rows;
  }

  // Get a specific saved route
  static async findById(id, customerId) {
    const query = `
      SELECT * FROM saved_routes 
      WHERE id = $1 AND customer_id = $2
    `;
    const result = await pool.query(query, [id, customerId]);
    return result.rows[0];
  }

  // Create a new saved route
  static async create(customerId, routeData) {
    const {
      route_name,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      pickup_country,
      pickup_company,
      pickup_contact_name,
      pickup_contact_phone,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country,
      delivery_company,
      delivery_contact_name,
      delivery_contact_phone,
      cargo_description,
      cargo_weight,
      cargo_length,
      cargo_width,
      cargo_height
    } = routeData;

    const query = `
      INSERT INTO saved_routes (
        customer_id, route_name,
        pickup_address, pickup_city, pickup_postal_code, pickup_country,
        pickup_company, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_postal_code, delivery_country,
        delivery_company, delivery_contact_name, delivery_contact_phone,
        cargo_description, cargo_weight, cargo_length, cargo_width, cargo_height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      customerId,
      route_name,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      pickup_country || 'Deutschland',
      pickup_company || null,
      pickup_contact_name || null,
      pickup_contact_phone || null,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country || 'Deutschland',
      delivery_company || null,
      delivery_contact_name || null,
      delivery_contact_phone || null,
      cargo_description || null,
      cargo_weight || null,
      cargo_length || null,
      cargo_width || null,
      cargo_height || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update a saved route
  static async update(id, customerId, routeData) {
    const {
      route_name,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      pickup_country,
      pickup_company,
      pickup_contact_name,
      pickup_contact_phone,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country,
      delivery_company,
      delivery_contact_name,
      delivery_contact_phone,
      cargo_description,
      cargo_weight,
      cargo_length,
      cargo_width,
      cargo_height
    } = routeData;

    const query = `
      UPDATE saved_routes SET
        route_name = $1,
        pickup_address = $2,
        pickup_city = $3,
        pickup_postal_code = $4,
        pickup_country = $5,
        pickup_company = $6,
        pickup_contact_name = $7,
        pickup_contact_phone = $8,
        delivery_address = $9,
        delivery_city = $10,
        delivery_postal_code = $11,
        delivery_country = $12,
        delivery_company = $13,
        delivery_contact_name = $14,
        delivery_contact_phone = $15,
        cargo_description = $16,
        cargo_weight = $17,
        cargo_length = $18,
        cargo_width = $19,
        cargo_height = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21 AND customer_id = $22
      RETURNING *
    `;

    const values = [
      route_name,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      pickup_country || 'Deutschland',
      pickup_company || null,
      pickup_contact_name || null,
      pickup_contact_phone || null,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country || 'Deutschland',
      delivery_company || null,
      delivery_contact_name || null,
      delivery_contact_phone || null,
      cargo_description || null,
      cargo_weight || null,
      cargo_length || null,
      cargo_width || null,
      cargo_height || null,
      id,
      customerId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete a saved route
  static async delete(id, customerId) {
    const query = `
      DELETE FROM saved_routes 
      WHERE id = $1 AND customer_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, customerId]);
    return result.rows[0];
  }

  // Increment usage count when route is used
  static async incrementUsage(id, customerId) {
    const query = `
      UPDATE saved_routes 
      SET usage_count = usage_count + 1,
          last_used_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND customer_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, customerId]);
    return result.rows[0];
  }
}

module.exports = SavedRoute;
