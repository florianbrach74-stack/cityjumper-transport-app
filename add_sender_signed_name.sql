-- Add sender_signed_name column to cmr_documents table
ALTER TABLE cmr_documents
ADD COLUMN IF NOT EXISTS sender_signed_name VARCHAR(255);

COMMENT ON COLUMN cmr_documents.sender_signed_name IS 'Name of the person who signed as sender (actual signer)';
