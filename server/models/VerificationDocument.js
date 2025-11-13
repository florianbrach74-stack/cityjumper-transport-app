const pool = require('../config/database');

class VerificationDocument {
  /**
   * Save a verification document permanently
   */
  static async create({ userId, documentType, fileName, filePath, fileSize, mimeType, uploadedBy }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Mark all previous documents of this type as not current
      await client.query(
        `UPDATE verification_documents 
         SET is_current = FALSE 
         WHERE user_id = $1 AND document_type = $2`,
        [userId, documentType]
      );

      // Insert new document
      const query = `
        INSERT INTO verification_documents (
          user_id, document_type, file_name, file_path, 
          file_size, mime_type, uploaded_by, is_current
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING *
      `;

      const result = await client.query(query, [
        userId,
        documentType,
        fileName,
        filePath,
        fileSize,
        mimeType,
        uploadedBy || userId
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current documents for a user (latest version of each type)
   */
  static async getCurrentDocuments(userId) {
    const query = `
      SELECT * FROM verification_documents
      WHERE user_id = $1 AND is_current = TRUE
      ORDER BY document_type
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get a specific document by ID
   */
  static async findById(documentId) {
    const query = 'SELECT * FROM verification_documents WHERE id = $1';
    const result = await pool.query(query, [documentId]);
    return result.rows[0];
  }

  /**
   * Get all contractors with their verification documents (admin view)
   */
  static async getAllContractorsWithDocuments() {
    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.company_name,
        u.first_name,
        u.last_name,
        u.verification_status,
        u.verified_at,
        json_agg(
          json_build_object(
            'id', vd.id,
            'document_type', vd.document_type,
            'file_name', vd.file_name,
            'file_path', vd.file_path,
            'uploaded_at', vd.uploaded_at,
            'is_current', vd.is_current
          )
        ) FILTER (WHERE vd.id IS NOT NULL) as documents
      FROM users u
      LEFT JOIN verification_documents vd ON u.id = vd.user_id AND vd.is_current = TRUE
      WHERE u.role = 'contractor'
      GROUP BY u.id, u.email, u.company_name, u.first_name, u.last_name, u.verification_status, u.verified_at
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = VerificationDocument;
