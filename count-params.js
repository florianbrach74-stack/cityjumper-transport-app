// Count columns
const columns = `
customer_id, pickup_address, pickup_city, pickup_postal_code, pickup_country, pickup_company,
pickup_date, pickup_time_from, pickup_time_to, pickup_contact_name, pickup_contact_phone,
delivery_address, delivery_city, delivery_postal_code, delivery_country, delivery_company,
delivery_date, delivery_time_from, delivery_time_to, delivery_contact_name, delivery_contact_phone,
vehicle_type, weight, length, width, height, pallets, description,
special_requirements, price, contractor_price, distance_km, duration_minutes, route_geometry,
needs_loading_help, needs_unloading_help, loading_help_fee, legal_delivery,
pickup_stops, delivery_stops, extra_stops_count, extra_stops_fee,
status
`.split(',').map(s => s.trim()).filter(s => s);

console.log('Columns:', columns.length);
columns.forEach((col, i) => console.log(`${i + 1}. ${col}`));

// Count values
const values = [
  'customer_id', 'pickup_address', 'pickup_city', 'pickup_postal_code', 'pickup_country', 'pickup_company',
  'pickup_date', 'pickup_time_from', 'pickup_time_to', 'pickup_contact_name', 'pickup_contact_phone',
  'delivery_address', 'delivery_city', 'delivery_postal_code', 'delivery_country', 'delivery_company',
  'delivery_date', 'delivery_time_from', 'delivery_time_to', 'delivery_contact_name', 'delivery_contact_phone',
  'vehicle_type', 'weight', 'length', 'width', 'height', 'pallets', 'description',
  'special_requirements', 'price', 'contractorPrice', 'distance_km', 'duration_minutes', 'route_geometry',
  'needs_loading_help',
  'needs_unloading_help',
  'loading_help_fee',
  'legal_delivery',
  'pickup_stops',
  'delivery_stops',
  'extra_stops_count',
  'extra_stops_fee',
];

console.log('\nValues:', values.length);
console.log('\nMatch:', columns.length === values.length ? '✅' : '❌');
