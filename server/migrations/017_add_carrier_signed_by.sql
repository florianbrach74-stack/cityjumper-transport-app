-- Add field to track who signed as carrier (employee name)
ALTER TABLE cmr_documents 
ADD COLUMN IF NOT EXISTS carrier_signed_by VARCHAR(255);

-- Add comment
COMMENT ON COLUMN cmr_documents.carrier_signed_by IS 'Name of person who signed as carrier (employee or contractor)';
