#!/bin/bash

echo "🔧 Applying database migration..."
echo ""

# Run migration
psql -U postgres -d zipmend -f server/migrations/add_additional_stops.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📦 New features are now available:"
    echo "  ✓ Multi-stop orders (multiple pickups/deliveries)"
    echo "  ✓ Admin can edit completed orders"
    echo "  ✓ Additional stops during execution"
    echo "  ✓ Automatic pricing: +6€ per extra stop"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi
