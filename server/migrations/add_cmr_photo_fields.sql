-- Add photo and signed name fields to CMR documents
ALTER TABLE cmr_documents 
ADD COLUMN IF NOT EXISTS consignee_signed_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS consignee_photo TEXT,
ADD COLUMN IF NOT EXISTS sender_photo TEXT,
ADD COLUMN IF NOT EXISTS carrier_photo TEXT;

-- Add comment
COMMENT ON COLUMN cmr_documents.consignee_signed_name IS 'Name of person who signed (entered by driver)';
COMMENT ON COLUMN cmr_documents.consignee_photo IS 'Photo URL as alternative to signature (e.g., Briefkasten delivery)';
COMMENT ON COLUMN cmr_documents.sender_photo IS 'Optional photo from sender';
COMMENT ON COLUMN cmr_documents.carrier_photo IS 'Optional photo from carrier';
