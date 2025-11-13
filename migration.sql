-- Create verification_documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INTEGER REFERENCES users(id),
  is_current BOOLEAN DEFAULT TRUE,
  replaced_by INTEGER REFERENCES verification_documents(id),
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_documents_user_id ON verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_type ON verification_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_verification_documents_current ON verification_documents(is_current);

-- Verify
SELECT 'Table created successfully!' as status;
