const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, role, company_name, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, password, role, company_name, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role, company_name, first_name, last_name, phone, created_at
    `;
    
    const values = [email, hashedPassword, role, company_name, first_name, last_name, phone];
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
    const { first_name, last_name, email, phone, company_name, address, city, postal_code } = data;
    
    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, email = $3, phone = $4, 
          company_name = $5, address = $6, city = $7, postal_code = $8
      WHERE id = $9
      RETURNING id, email, role, company_name, first_name, last_name, phone, address, city, postal_code, created_at
    `;
    
    const values = [first_name, last_name, email, phone, company_name, address, city, postal_code, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(userId, hashedPassword) {
    const query = 'UPDATE users SET password = $1 WHERE id = $2';
    await pool.query(query, [hashedPassword, userId]);
  }
}

module.exports = User;
