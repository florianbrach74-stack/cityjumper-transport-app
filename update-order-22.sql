-- Update Order #22 to test legal delivery and loading help features
UPDATE transport_orders 
SET 
  needs_loading_help = TRUE,
  needs_unloading_help = TRUE,
  loading_help_fee = 12.00,
  legal_delivery = TRUE
WHERE id = 22;

-- Verify the update
SELECT 
  id, 
  needs_loading_help, 
  needs_unloading_help, 
  loading_help_fee, 
  legal_delivery 
FROM transport_orders 
WHERE id = 22;
