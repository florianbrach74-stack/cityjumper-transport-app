-- Add separate fields for signer names (who actually signs) vs contact names (in address fields)

ALTER TABLE cmr_documents
ADD COLUMN IF NOT EXISTS sender_signer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS consignee_signer_name VARCHAR(255);

COMMENT ON COLUMN cmr_documents.sender_signer_name IS 'Name of person who actually signed at pickup (not company name)';
COMMENT ON COLUMN cmr_documents.consignee_signer_name IS 'Name of person who actually signed at delivery (not company name)';

-- Note: sender_name and consignee_name remain for company/contact info in address fields
