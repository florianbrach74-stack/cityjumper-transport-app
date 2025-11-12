#!/bin/bash

# CityJumper Test Orders Creator
# This script creates 3 test orders via the API

API_URL="https://courierly-api-production-01e4.up.railway.app"

echo "🔐 Please provide your login credentials:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

echo "🔑 Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed! Please check your credentials."
  exit 1
fi

echo "✅ Login successful!"
echo ""
echo "📦 Creating 3 test orders..."
echo ""

# Order 1: Hamburg → München
echo "Creating Order 1: Hamburg → München..."
curl -s -X POST "$API_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pickup_address": "Reeperbahn 154",
    "pickup_city": "Hamburg",
    "pickup_postal_code": "20359",
    "pickup_contact_name": "Klaus Schmidt",
    "pickup_contact_phone": "+49 40 123456",
    "pickup_date": "'$(date -v+2d +%Y-%m-%d)'",
    "pickup_time_from": "08:00",
    "pickup_time_to": "12:00",
    "delivery_address": "Marienplatz 8",
    "delivery_city": "München",
    "delivery_postal_code": "80331",
    "delivery_contact_name": "Maria Weber",
    "delivery_contact_phone": "+49 89 654321",
    "delivery_date": "'$(date -v+2d +%Y-%m-%d)'",
    "delivery_time_from": "08:00",
    "delivery_time_to": "12:00",
    "vehicle_type": "Mittlerer Transporter (bis 4 Paletten)",
    "weight": 350.00,
    "pallets": 3,
    "description": "3 Paletten mit Elektronik",
    "price": 520.00,
    "distance_km": 775,
    "duration_minutes": 450
  }' > /dev/null
echo "✅ Order 1 created"

# Order 2: Berlin → Frankfurt
echo "Creating Order 2: Berlin → Frankfurt..."
curl -s -X POST "$API_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pickup_address": "Alexanderplatz 1",
    "pickup_city": "Berlin",
    "pickup_postal_code": "10178",
    "pickup_contact_name": "Thomas Müller",
    "pickup_contact_phone": "+49 30 987654",
    "pickup_date": "'$(date -v+3d +%Y-%m-%d)'",
    "pickup_time_from": "09:00",
    "pickup_time_to": "13:00",
    "delivery_address": "Zeil 106",
    "delivery_city": "Frankfurt am Main",
    "delivery_postal_code": "60313",
    "delivery_contact_name": "Anna Fischer",
    "delivery_contact_phone": "+49 69 456789",
    "delivery_date": "'$(date -v+3d +%Y-%m-%d)'",
    "delivery_time_from": "09:00",
    "delivery_time_to": "13:00",
    "vehicle_type": "Kleintransporter (bis 2 Paletten)",
    "weight": 150.00,
    "pallets": 2,
    "description": "2 Paletten mit Büromaterial",
    "price": 380.00,
    "distance_km": 550,
    "duration_minutes": 320
  }' > /dev/null
echo "✅ Order 2 created"

# Order 3: Köln → Stuttgart
echo "Creating Order 3: Köln → Stuttgart..."
curl -s -X POST "$API_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pickup_address": "Hohe Straße 1",
    "pickup_city": "Köln",
    "pickup_postal_code": "50667",
    "pickup_contact_name": "Peter Wagner",
    "pickup_contact_phone": "+49 221 111222",
    "pickup_date": "'$(date -v+4d +%Y-%m-%d)'",
    "pickup_time_from": "10:00",
    "pickup_time_to": "14:00",
    "delivery_address": "Königstraße 1A",
    "delivery_city": "Stuttgart",
    "delivery_postal_code": "70173",
    "delivery_contact_name": "Sophie Becker",
    "delivery_contact_phone": "+49 711 333444",
    "delivery_date": "'$(date -v+4d +%Y-%m-%d)'",
    "delivery_time_from": "10:00",
    "delivery_time_to": "14:00",
    "vehicle_type": "Großer Transporter (bis 6 Paletten)",
    "weight": 500.00,
    "pallets": 5,
    "description": "5 Paletten mit Maschinen",
    "price": 650.00,
    "distance_km": 420,
    "duration_minutes": 280
  }' > /dev/null
echo "✅ Order 3 created"

echo ""
echo "🎉 All 3 orders created successfully!"
echo "📱 Check your dashboard: https://courierly-transport.vercel.app"
