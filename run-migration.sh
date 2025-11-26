#!/bin/bash

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starte Datenbank-Migration für Retouren-System...${NC}\n"

# Prüfe ob Railway CLI installiert ist
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI ist nicht installiert!${NC}"
    echo -e "${YELLOW}Installiere mit: npm install -g @railway/cli${NC}"
    echo -e "${YELLOW}Oder führe die Migration manuell über Railway Web-Interface aus.${NC}"
    exit 1
fi

# Prüfe ob mit Railway verbunden
if ! railway status &> /dev/null; then
    echo -e "${RED}❌ Nicht mit Railway verbunden!${NC}"
    echo -e "${YELLOW}Führe aus: railway login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI gefunden${NC}"
echo -e "${YELLOW}📊 Führe Migration aus...${NC}\n"

# Führe Migration aus
railway run psql -c "
-- Migration: Retouren-System
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none' 
  CHECK (return_status IN ('none', 'pending', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_initiated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

COMMENT ON COLUMN transport_orders.return_status IS 'Status der Retoure: none, pending, in_progress, completed';
COMMENT ON COLUMN transport_orders.return_fee IS 'Retourengebühr (max. Auftragswert)';
COMMENT ON COLUMN transport_orders.return_reason IS 'Grund für die Retoure';
COMMENT ON COLUMN transport_orders.return_initiated_by IS 'Admin der die Retoure gestartet hat';
COMMENT ON COLUMN transport_orders.return_notes IS 'Zusätzliche Notizen zur Retoure';

CREATE INDEX IF NOT EXISTS idx_orders_return_status ON transport_orders(return_status);
"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Migration erfolgreich ausgeführt!${NC}"
    
    # Verifizierung
    echo -e "\n${YELLOW}🔍 Verifiziere Migration...${NC}\n"
    railway run psql -c "
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'transport_orders' 
      AND column_name LIKE 'return_%'
    ORDER BY column_name;
    "
    
    echo -e "\n${GREEN}✅ Migration abgeschlossen!${NC}"
    echo -e "${GREEN}Die Retouren-Funktion ist jetzt verfügbar.${NC}"
else
    echo -e "\n${RED}❌ Migration fehlgeschlagen!${NC}"
    echo -e "${YELLOW}Bitte führe die Migration manuell über Railway Web-Interface aus.${NC}"
    exit 1
fi
