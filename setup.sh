#!/bin/bash

echo "🚀 ZipMend Transport Management - Setup Script"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert. Bitte installieren Sie Node.js von https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js gefunden: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL ist nicht installiert. Bitte installieren Sie PostgreSQL."
    exit 1
fi

echo "✅ PostgreSQL gefunden"

# Install dependencies
echo ""
echo "📦 Installiere Abhängigkeiten..."
npm install

if [ -d "client" ]; then
    cd client
    npm install
    cd ..
fi

echo "✅ Abhängigkeiten installiert"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Erstelle .env Datei..."
    cp .env.example .env
    echo "✅ .env Datei erstellt"
    echo "⚠️  WICHTIG: Bitte bearbeiten Sie die .env Datei mit Ihren Datenbank- und Email-Credentials!"
else
    echo "✅ .env Datei existiert bereits"
fi

# Create database
echo ""
read -p "Möchten Sie die Datenbank 'zipmend_db' erstellen? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    createdb zipmend_db 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Datenbank 'zipmend_db' erstellt"
        
        # Import schema
        echo "📊 Importiere Datenbank-Schema..."
        psql zipmend_db < server/database/schema.sql
        if [ $? -eq 0 ]; then
            echo "✅ Schema erfolgreich importiert"
        else
            echo "❌ Fehler beim Importieren des Schemas"
        fi
    else
        echo "⚠️  Datenbank existiert bereits oder Fehler beim Erstellen"
    fi
fi

echo ""
echo "=============================================="
echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. Bearbeiten Sie die .env Datei mit Ihren Credentials"
echo "2. Starten Sie die Anwendung mit: npm run dev"
echo ""
echo "Die Anwendung wird verfügbar sein unter:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:5000"
echo ""
echo "Weitere Informationen finden Sie in SETUP.md und README.md"
echo "=============================================="
