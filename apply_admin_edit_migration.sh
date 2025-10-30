#!/bin/bash

# Apply admin edit features migration
# This adds support for:
# - Additional stops during order execution
# - Clarification time tracking
# - Edit history for admin changes
# - Multi-stop orders at creation time

echo "🔧 Applying admin edit features migration..."

# Get database connection details from environment or use defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-zipmend}
DB_USER=${DB_USER:-postgres}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client."
    exit 1
fi

echo "📊 Database: $DB_NAME"
echo "🖥️  Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Apply migration
echo "Applying migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f server/migrations/add_additional_stops.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📦 New features available:"
    echo "  ✓ Admin can edit completed orders (price, waiting time)"
    echo "  ✓ Admin can add additional stops during order execution"
    echo "  ✓ Clarification time tracking for address corrections"
    echo "  ✓ Full edit history for audit trail"
    echo "  ✓ Multi-stop orders (multiple pickups/deliveries)"
    echo "  ✓ Automatic pricing: +6€ per additional stop"
    echo ""
    echo "🚀 Please restart your server to use the new features."
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above."
    exit 1
fi
