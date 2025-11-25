# 🔒 Safepoint - 25. November 2025, 12:37 Uhr

## ✅ Aktueller Stand

### Was funktioniert:
- ✅ **Kunden-Dashboard**: Aufträge werden korrekt angezeigt
- ✅ **Abrechnungen**: Reports und Zusammenfassungen funktionieren
- ✅ **Railway-Deployment**: App läuft stabil auf Production
- ✅ **Performance**: Console-Logs optimiert, 404-Fehler behandelt
- ✅ **API-Verbindung**: Backend und Frontend kommunizieren korrekt
- ✅ **Authentifizierung**: Token-basierte Auth funktioniert

### Letzte Änderungen:
1. **API Error-Handling verbessert**
   - Detaillierte Fehlerausgaben bei Auth-Problemen
   - 404-Fehler werden gracefully behandelt
   - Console-Logs drastisch reduziert

2. **Performance-Optimierungen**
   - Penalties-API-Fehler werden silent behandelt
   - Überflüssige Success-Logs entfernt
   - Nur relevante Fehler werden geloggt

3. **Production-Deployment**
   - Railway-URL konfiguriert: `https://cityjumper-api-production-01e4.up.railway.app`
   - Auto-Deployment via GitHub aktiviert
   - Datenbank: Railway PostgreSQL (ballast.proxy.rlwy.net:10003)

---

## 🚧 TODO: Nächste Features

### 1. Stornierte Aufträge in Abrechnung anzeigen

**Problem:**
Stornierte Aufträge werden aktuell nicht unter "Abgeschlossene Aufträge" und "Abrechnungen" angezeigt, obwohl der Kunde bei Stornierung innerhalb von 24h eine Stornierungsgebühr zahlen muss.

**Lösung:**
- [ ] Stornierte Aufträge unter "Abgeschlossene Aufträge" anzeigen
- [ ] Stornierte Aufträge in der Abrechnung berücksichtigen
- [ ] Stornierungsgebühr automatisch berechnen (siehe AGBs)
- [ ] Stornierungsstatus und Gebühr im Dashboard anzeigen

**Betroffene Dateien:**
- `client/src/pages/CustomerDashboard.jsx` - Filter für abgeschlossene Aufträge anpassen
- `client/src/components/ReportsSummary.jsx` - Stornierte Aufträge in Reports einbeziehen
- `server/routes/reports.js` - Query anpassen um stornierte Aufträge einzuschließen

**Implementierung:**
```javascript
// In CustomerDashboard.jsx - Zeile 186
// AKTUELL:
<span>Abgeschlossene Aufträge ({orders.filter(o => o.status === 'completed' || o.status === 'pending_approval').length})</span>

// NEU:
<span>Abgeschlossene Aufträge ({orders.filter(o => 
  o.status === 'completed' || 
  o.status === 'pending_approval' || 
  o.cancellation_status === 'cancelled_by_customer'
).length})</span>

// In reports.js - Zeile 37
// Query anpassen:
WHERE (o.status = 'completed' OR o.cancellation_status IS NOT NULL)
```

**Stornierungsgebühren (aus AGBs):**
- Stornierung innerhalb 24h vor Abholung: 100% des Auftragswertes
- Stornierung nach Auftragsannahme: Stornierungsgebühr wird berechnet
- Stornierung durch Auftragnehmer: Kunde erhält Kompensation

---

### 2. Retouren-System für Admin

**Problem:**
Wenn der Empfänger nicht da ist, muss der Admin die Möglichkeit haben, eine Retoure zu starten. Der Fahrer muss das Transportgut zum Absender zurückbringen.

**Anforderungen:**
- [ ] Admin kann Auftrag auf "Retour" setzen
- [ ] Retourenpreis festlegen (max. Auftragswert)
- [ ] Retourengebühr automatisch zur Abrechnung hinzufügen (wie Wartezeit)
- [ ] Retourenstatus im Dashboard anzeigen
- [ ] Email-Benachrichtigung an Kunde und Fahrer

**Neue Datenbank-Spalten:**
```sql
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) CHECK (return_status IN ('none', 'pending', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_initiated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP;

COMMENT ON COLUMN transport_orders.return_status IS 'Status der Retoure: none, pending, in_progress, completed';
COMMENT ON COLUMN transport_orders.return_fee IS 'Retourengebühr (max. Auftragswert)';
COMMENT ON COLUMN transport_orders.return_reason IS 'Grund für die Retoure (z.B. Empfänger nicht angetroffen)';
```

**Neue API-Endpunkte:**
```javascript
// server/routes/admin.js

// Retoure starten
router.post('/orders/:id/initiate-return', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { returnFee, reason } = req.body;
  
  // Validierung: returnFee <= Auftragswert
  // Status auf 'return_pending' setzen
  // Email an Kunde und Fahrer senden
});

// Retoure abschließen
router.post('/orders/:id/complete-return', adminAuth, async (req, res) => {
  // Status auf 'return_completed' setzen
  // Retourengebühr zur Rechnung hinzufügen
});
```

**UI-Komponente:**
```javascript
// client/src/components/InitiateReturnModal.jsx
// Modal mit:
// - Grund für Retoure (Dropdown: "Empfänger nicht angetroffen", "Falsche Adresse", etc.)
// - Retourenpreis (Input mit max. Auftragswert)
// - Notizen (Textarea)
// - Bestätigung
```

**Integration in Admin-Dashboard:**
```javascript
// In AdminDashboard.jsx
// Button "Retoure starten" bei Aufträgen mit Status 'delivered' oder 'in_transit'
<button onClick={() => setSelectedOrderForReturn(order)}>
  <TruckIcon /> Retoure starten
</button>
```

**Abrechnung:**
```javascript
// In reports.js - Zeile 98-104
// Retourengebühr wie Wartezeit behandeln:
const returnFee = parseFloat(order.return_fee) || 0;
summary.totalRevenue += returnFee;
summary.totalReturnFees += returnFee; // Neue Kategorie
```

---

## 📁 Wichtige Dateien

### Frontend:
- `client/src/pages/CustomerDashboard.jsx` - Kunden-Dashboard
- `client/src/pages/AdminDashboard.jsx` - Admin-Dashboard
- `client/src/components/ReportsSummary.jsx` - Abrechnungen
- `client/src/services/api.js` - API-Konfiguration

### Backend:
- `server/routes/orders.js` - Auftrags-Routen
- `server/routes/admin.js` - Admin-Routen
- `server/routes/reports.js` - Abrechnungs-Routen
- `server/routes/cancellation.js` - Stornierungslogik
- `server/controllers/orderController.js` - Auftrags-Controller
- `server/models/Order.js` - Auftrags-Model

### Datenbank:
- `server/config/database.js` - Datenbank-Konfiguration
- Railway PostgreSQL: `ballast.proxy.rlwy.net:10003`

---

## 🔧 Technische Details

### Aktuelle Architektur:
```
Frontend (React + Vite)
  ↓ Axios API Calls
Backend (Node.js + Express)
  ↓ pg Pool
PostgreSQL (Railway)
```

### Deployment:
- **GitHub**: `florianbrach74-stack/cityjumper-transport-app`
- **Railway Backend**: `cityjumper-api-production-01e4.up.railway.app`
- **Railway Frontend**: Auto-deployed from GitHub
- **Datenbank**: Railway PostgreSQL (öffentliche URL)

### Environment Variables (Railway):
```env
DATABASE_URL=postgresql://postgres:***@ballast.proxy.rlwy.net:10003/railway
JWT_SECRET=***
CLOUDINARY_CLOUD_NAME=dbh4tml1mm
CLOUDINARY_API_KEY=176675355691146
CLOUDINARY_API_SECRET=***
RESEND_API_KEY=re_V8FVD4ae_545MPCr7cQaQ4HGOJ76FFRny
EMAIL_HOST=send.one.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@courierly.de
EMAIL_FROM=info@courierly.de
```

---

## 📝 Stornierungsgebühren (AGBs)

### Kunde storniert:
1. **Vor Auftragsannahme**: Kostenlos
2. **Nach Auftragsannahme, >24h vor Abholung**: 30% des Auftragswertes
3. **<24h vor Abholung**: 100% des Auftragswertes
4. **Nach Abholung**: 100% des Auftragswertes + ggf. Retourengebühr

### Auftragnehmer storniert:
1. **Vor Abholung**: Kunde erhält volle Erstattung
2. **Nach Abholung**: Kunde erhält Kompensation (z.B. 150% des Auftragswertes)

### Aktuelle Implementierung:
- Siehe `server/routes/cancellation.js`
- Gebühren werden in `cancellation_fee` gespeichert
- Status wird in `cancellation_status` gespeichert

---

## 🎯 Prioritäten für nächste Session

### Hohe Priorität:
1. ✅ **Stornierte Aufträge in Abrechnung** (einfach, wichtig für Kunden)
2. ✅ **Retouren-System** (komplex, aber wichtig für Betrieb)

### Mittlere Priorität:
3. Email-Templates für Retouren
4. Dashboard-Statistiken für Retouren
5. Automatische Retourengebühr-Berechnung

### Niedrige Priorität:
6. Retouren-Historie
7. Retouren-Reports
8. Automatische Retouren-Eskalation

---

## 🚀 Schnellstart für nächste Session

### 1. Repository klonen (falls nötig):
```bash
cd /Users/florianbrach/Desktop/Zipemendapp/CascadeProjects/windsurf-project
git pull origin main
```

### 2. Dependencies installieren:
```bash
npm install
cd client && npm install && cd ..
```

### 3. Server starten:
```bash
npm run dev
# Oder separat:
# npm run server (Backend auf Port 5001)
# npm run client (Frontend auf Port 5173)
```

### 4. Datenbank-Migration für Retouren:
```sql
-- In Railway PostgreSQL Query Tab ausführen:
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_initiated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP;
```

### 5. Feature-Branch erstellen:
```bash
git checkout -b feature/cancelled-orders-in-billing
# Oder:
git checkout -b feature/return-system
```

---

## 📞 Support & Kontakt

- **Entwickler**: Cascade AI
- **Projekt**: Courierly Transport App
- **GitHub**: github.com/florianbrach74-stack/cityjumper-transport-app
- **Railway**: railway.app

---

## 🔐 Sicherheitshinweise

- ⚠️ `.env`-Datei niemals committen
- ⚠️ API-Keys regelmäßig rotieren
- ⚠️ Railway Environment Variables verwenden
- ⚠️ JWT_SECRET stark und einzigartig halten

---

**Erstellt am**: 25. November 2025, 12:37 Uhr
**Status**: Production läuft stabil ✅
**Nächste Features**: Stornierte Aufträge + Retouren-System
