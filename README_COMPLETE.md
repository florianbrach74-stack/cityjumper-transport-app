# CityJumper Transport App - Vollständige Dokumentation

## 📋 Inhaltsverzeichnis
1. [Überblick](#überblick)
2. [Features](#features)
3. [Technologie-Stack](#technologie-stack)
4. [Installation](#installation)
5. [Deployment](#deployment)
6. [Benutzer-Workflows](#benutzer-workflows)
7. [API-Dokumentation](#api-dokumentation)
8. [Datenbank-Schema](#datenbank-schema)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Überblick

CityJumper ist eine vollständige Transport-Management-Plattform mit:
- **Bewerbungssystem** für Auftragnehmer
- **CMR-Frachtbrief** mit digitalen Unterschriften
- **Verifizierungs-System** für Auftragnehmer
- **Admin-Dashboard** für vollständige Kontrolle
- **Email-Benachrichtigungen** bei allen wichtigen Events

---

## ✨ Features

### 1. Bewerbungssystem
- Auftragnehmer bewerben sich mit eigenem Preis (max. 85% des Kundenpreises)
- Admin sieht alle Bewerbungen mit Marge-Berechnung
- Admin kann Bewerbungen akzeptieren/ablehnen
- Automatische Email-Benachrichtigungen

### 2. Status-Workflow
- **Pending** → Auftrag erstellt
- **Accepted** → Auftragnehmer zugewiesen
- **Picked Up** → Abgeholt (Email an Kunde)
- **Delivered** → Zugestellt (Email + CMR öffnet sich)
- **Completed** → Nach Unterschrift (Auftrag in "Abgeschlossen")

### 3. CMR-Unterschriften
- **3 Unterschriften** auf einem Gerät:
  - Absender (bei Abholung)
  - Frachtführer (bei Abholung, Name automatisch)
  - Empfänger (bei Zustellung)
- PDF-Download mit allen Unterschriften
- Base64-Signatur-Speicherung

### 4. Verifizierungs-System
- **Upload-Pflicht:**
  - Transportversicherung (PDF)
  - Gewerbeanmeldung (PDF)
  - Mindestlohngesetz-Erklärung (Unterschrift)
- **Status:**
  - `pending` → Dokumente werden geprüft
  - `approved` → Freigegeben, kann sich bewerben
  - `rejected` → Abgelehnt, muss neu einreichen
- **Sperre:** Keine Bewerbungen ohne Freigabe

### 5. Tabs für abgeschlossene Aufträge
- Kunde: Aktive / Abgeschlossene
- Auftragnehmer: Verfügbar / Aktive / Bewerbungen / Abgeschlossene
- Admin: Alle Aufträge + Bewerbungen + Verifizierungen

---

## 🛠 Technologie-Stack

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (Railway)
- **JWT** Authentication
- **Nodemailer** für Emails
- **PDFKit** für CMR-PDFs

### Frontend
- **React** + **Vite**
- **React Router** für Navigation
- **TailwindCSS** für Styling
- **Lucide React** für Icons
- **react-signature-canvas** für Unterschriften

### Deployment
- **Backend:** Railway (https://cityjumper-api-production-01e4.up.railway.app)
- **Frontend:** Vercel (https://cityjumper-transport-app.vercel.app)
- **Database:** Railway PostgreSQL

---

## 📦 Installation

### Voraussetzungen
- Node.js 18+
- PostgreSQL 14+
- npm oder yarn

### Backend Setup
```bash
cd server
npm install

# .env erstellen
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=5000

# Datenbank-Migrationen ausführen
psql $DATABASE_URL < migrations/add_order_timestamps.sql
psql $DATABASE_URL < migrations/create_order_bids.sql
psql $DATABASE_URL < migrations/add_contractor_verification.sql

# Server starten
npm start
```

### Frontend Setup
```bash
cd client
npm install

# .env erstellen
VITE_API_URL=http://localhost:5000

# Dev-Server starten
npm run dev
```

---

## 🚀 Deployment

### Railway (Backend)
1. Repository mit Railway verbinden
2. Environment Variables setzen:
   - `DATABASE_URL` (automatisch)
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `NODE_ENV=production`
3. Deploy → Automatisch bei Git Push

### Vercel (Frontend)
1. Repository mit Vercel verbinden
2. Build Settings:
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Environment Variables:
   - `VITE_API_URL=https://cityjumper-api-production-01e4.up.railway.app`
4. Deploy → Automatisch bei Git Push

---

## 👥 Benutzer-Workflows

### Kunde
1. Registrieren → Login
2. Auftrag erstellen (Abholung, Zustellung, Details)
3. Warten auf Bewerbungen
4. Admin weist Auftragnehmer zu
5. Erhält Email bei Abholung
6. Erhält Email bei Zustellung
7. Kann CMR herunterladen
8. Sieht Auftrag in "Abgeschlossene Aufträge"

### Auftragnehmer (Neu registriert)
1. Registrieren → Login
2. Sieht Banner: "Account nicht verifiziert"
3. Klickt "Jetzt verifizieren"
4. Lädt Dokumente hoch:
   - Transportversicherung (PDF)
   - Gewerbeanmeldung (PDF)
5. Unterschreibt Mindestlohngesetz-Erklärung
6. Wartet auf Freigabe (Status: `pending`)
7. Erhält Email bei Freigabe
8. Kann sich jetzt auf Aufträge bewerben

### Auftragnehmer (Verifiziert)
1. Sieht verfügbare Aufträge (nur PLZ + Stadt)
2. Klickt "Auf Auftrag bewerben"
3. Gibt Preis ein (max. 85% des Kundenpreises)
4. Optional: Nachricht hinzufügen
5. Bewerbung absenden
6. Wartet auf Admin-Entscheidung
7. Erhält Email bei Zusage
8. Auftrag erscheint in "Aktive Aufträge"
9. Bei Abholung:
   - CMR öffnen
   - Button "Absender-Unterschrift" → Name eingeben → Unterschreiben
   - Button "Frachtführer-Unterschrift" → Unterschreiben (Name automatisch)
   - Button "Als abgeholt markieren"
10. Bei Zustellung:
    - CMR öffnen
    - Button "Empfänger-Unterschrift" → Name eingeben → Unterschreiben
    - Button "Zustellung abschließen"
11. Auftrag verschwindet aus "Aktive"
12. Auftrag erscheint in "Abgeschlossene Aufträge"

### Admin
1. Login → Admin-Dashboard
2. **Tab "Aufträge":**
   - Alle Aufträge sehen
   - Status ändern
   - Aufträge zuweisen
   - CMR herunterladen
   - Aufträge löschen
3. **Tab "Aufträge" → Button "Bewerbungen":**
   - Alle Bewerbungen für einen Auftrag sehen
   - Gebotenen Preis + Marge sehen
   - Bewerbung akzeptieren → Auftrag wird zugewiesen
   - Bewerbung ablehnen
4. **Tab "Benutzer":**
   - Alle Benutzer sehen
   - Rollen ändern
5. **Tab "Verifizierungen":**
   - Alle nicht-verifizierten Auftragnehmer sehen
   - Dokumente ansehen (Transportversicherung, Gewerbeanmeldung)
   - Mindestlohngesetz-Unterschrift prüfen
   - Button "Freigeben" → Auftragnehmer kann sich bewerben
   - Button "Ablehnen" → Auftragnehmer muss neu einreichen

---

## 🔌 API-Dokumentation

### Authentication
```
POST /api/auth/register - Registrierung
POST /api/auth/login - Login
GET /api/auth/me - Aktueller User
```

### Orders
```
GET /api/orders - Eigene Aufträge
GET /api/orders/available - Verfügbare Aufträge (Auftragnehmer)
POST /api/orders - Auftrag erstellen
PUT /api/orders/:id/status - Status ändern
```

### Bids (Bewerbungen)
```
POST /api/bids/orders/:orderId/bid - Bewerbung erstellen
GET /api/bids/my-bids - Eigene Bewerbungen
GET /api/bids/orders/:orderId - Bewerbungen für Auftrag (Admin)
POST /api/bids/:bidId/accept - Bewerbung akzeptieren (Admin)
POST /api/bids/:bidId/reject - Bewerbung ablehnen (Admin)
```

### CMR
```
GET /api/cmr/order/:orderId - CMR für Auftrag
POST /api/cmr/:cmrId/signature - Unterschrift hinzufügen (authenticated)
POST /api/cmr/public/:cmrNumber/sender - Absender-Unterschrift (public)
POST /api/cmr/public/:cmrNumber/carrier - Frachtführer-Unterschrift (public)
POST /api/cmr/public/:cmrNumber/consignee - Empfänger-Unterschrift (public)
GET /api/cmr/:cmrNumber/download - PDF herunterladen
```

### Verification
```
POST /api/verification/submit - Verifizierung einreichen
GET /api/verification/status - Status abrufen
POST /api/verification/:userId/approve - Freigeben (Admin)
POST /api/verification/:userId/reject - Ablehnen (Admin)
```

### Admin
```
GET /api/admin/orders - Alle Aufträge
GET /api/admin/users - Alle Benutzer
GET /api/admin/stats - Statistiken
PATCH /api/admin/users/:userId/role - Rolle ändern
```

---

## 🗄 Datenbank-Schema

### users
```sql
id, email, password_hash, first_name, last_name, 
company_name, phone, role (customer/contractor/admin),
verification_status (pending/approved/rejected),
insurance_document_url, business_license_url,
minimum_wage_declaration_signed, minimum_wage_signature,
verified_by, verified_at, verification_notes
```

### transport_orders
```sql
id, customer_id, contractor_id, status,
pickup_address, pickup_city, pickup_postal_code, pickup_date,
delivery_address, delivery_city, delivery_postal_code,
vehicle_type, weight, pallets, description, price,
picked_up_at, delivered_at, completed_at
```

### order_bids
```sql
id, order_id, contractor_id, bid_amount, message,
status (pending/accepted/rejected), created_at
```

### cmr_documents
```sql
id, order_id, cmr_number, status,
sender_signature, sender_signed_at, sender_signed_name,
carrier_signature, carrier_signed_at, carrier_signed_name,
consignee_signature, consignee_signed_at, consignee_signed_name,
delivered_at, delivery_location, delivery_remarks
```

---

## 🐛 Troubleshooting

### Backend startet nicht
```bash
# Prüfen ob Port 5000 frei ist
lsof -i :5000
kill -9 <PID>

# Datenbank-Verbindung prüfen
psql $DATABASE_URL -c "SELECT 1"

# Logs prüfen
tail -f logs/server.log
```

### Frontend baut nicht
```bash
# Cache löschen
rm -rf node_modules .vite
npm install
npm run build
```

### Unterschriften werden nicht angezeigt
- Prüfen ob `react-signature-canvas` installiert ist
- Browser-Console auf Fehler prüfen
- Sicherstellen dass Base64-String korrekt gespeichert wird

### Emails werden nicht versendet
- Gmail: App-Passwort verwenden (nicht normales Passwort)
- SMTP-Settings in .env prüfen
- Logs prüfen: `console.log` in `sendEmail` Funktion

### Bewerbungen nicht möglich
- Prüfen ob Auftragnehmer verifiziert ist (`verification_status = 'approved'`)
- Browser-Console auf 403-Fehler prüfen
- Backend-Logs prüfen

---

## 📝 Entwickler-Notizen

### Wichtige Dateien
- `server/controllers/bidController.js` - Bewerbungslogik
- `server/controllers/verificationController.js` - Verifizierungslogik
- `server/controllers/cmrController.js` - CMR + Unterschriften
- `client/src/pages/ContractorDashboard.jsx` - Auftragnehmer-UI
- `client/src/pages/AdminDashboard.jsx` - Admin-UI
- `client/src/pages/VerificationPage.jsx` - Verifizierungs-UI
- `client/src/components/CMRViewer.jsx` - CMR-Anzeige + Unterschriften

### Nächste Features (Optional)
- [ ] Push-Benachrichtigungen
- [ ] Echtzeit-Tracking
- [ ] Rechnungs-Generierung
- [ ] Multi-Language Support
- [ ] Mobile App (React Native)

---

## 📞 Support

Bei Fragen oder Problemen:
- Email: support@cityjumper.de
- GitHub Issues: [Link]

---

**Version:** 1.0.0  
**Letztes Update:** Oktober 2025  
**Entwickelt mit ❤️ für CityJumper**
