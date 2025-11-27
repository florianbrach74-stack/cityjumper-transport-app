#!/bin/bash

echo "🚀 Running saved_routes migration on Railway..."
echo ""

# Get the production API URL from .env
API_URL=$(grep REACT_APP_API_URL client/.env.production | cut -d '=' -f2)

if [ -z "$API_URL" ]; then
  echo "❌ Could not find API_URL in client/.env.production"
  exit 1
fi

echo "📍 API URL: $API_URL"
echo ""

# Call the migration endpoint
echo "🔧 Creating saved_routes table..."
response=$(curl -s -X POST "$API_URL/ensure-saved-routes-table")

echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "✅ Migration completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Check Railway logs to verify deployment"
echo "   2. Test the feature in the frontend"
