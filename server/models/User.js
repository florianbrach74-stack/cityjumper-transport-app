const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ 
    email, password, role, company_name, first_name, last_name, phone,
    company_address, company_postal_code, company_city, company_country,
    tax_id, vat_id
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (
        email, password, role, company_name, first_name, last_name, phone,
        company_address, company_postal_code, company_city, company_country,
        tax_id, vat_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, email, role, company_name, first_name, last_name, phone,
                company_address, company_postal_code, company_city, created_at
    `;
    
    const values = [
      email, hashedPassword, role, company_name, first_name, last_name, phone,
      company_address, company_postal_code, company_city, company_country,
      tax_id, vat_id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, email, role, company_name, first_name, last_name, phone, created_at,
             verification_status, verified_by, verified_at, verification_notes
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(role = null) {
    let query = 'SELECT id, email, role, company_name, first_name, last_name, phone, created_at FROM users';
    const values = [];
    
    if (role) {
      query += ' WHERE role = $1';
      values.push(role);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async updateProfile(userId, data) {
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      company_name,
      company_address,
      company_city,
      company_postal_code,
      tax_id,
      vat_id
    } = data;
    
    const query = `
      UPDATE users
      SET first_name = $1, 
          last_name = $2, 
          email = $3, 
          phone = $4, 
          company_name = $5, 
          company_address = $6, 
          company_city = $7, 
          company_postal_code = $8,
          tax_id = $9,
          vat_id = $10
      WHERE id = $11
      RETURNING id, email, role, company_name, company_address, company_city, company_postal_code,
                first_name, last_name, phone, tax_id, vat_id, created_at
    `;
    
    const values = [
      first_name || null, 
      last_name || null, 
      email || null, 
      phone || null, 
      company_name || null,
      company_address || null,
      company_city || null,
      company_postal_code || null,
      tax_id || null,
      vat_id || null,
      userId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password = $1 WHERE id = $2';
    await pool.query(query, [hashedPassword, userId]);
  }
}

module.exports = User;
