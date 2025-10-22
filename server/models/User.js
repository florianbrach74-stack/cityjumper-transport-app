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
      SELECT id, email, role, company_name, first_name, last_name, phone, created_at
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
}

module.exports = User;
