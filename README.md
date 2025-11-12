# 📦 Courierly - Transport Management Platform

<div align="center">

![Courierly Logo](https://img.shields.io/badge/Courierly-Express%20Delivery-00d9ff?style=for-the-badge&logo=truck&logoColor=white)

**Moderne Transport- und Kurierdienst-Plattform mit Echtzeit-Routing & Mindestlohn-Garantie**

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=flat-square)](https://courierly-transport.vercel.app)
[![Backend](https://img.shields.io/badge/API-Railway-blueviolet?style=flat-square)](https://courierly-api-production-01e4.up.railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 📋 Inhaltsverzeichnis

- [Überblick](#-überblick)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Deployment](#-deployment)
- [Benutzerrollen](#-benutzerrollen)
- [API Dokumentation](#-api-dokumentation)
- [Design System](#-design-system)
- [Lizenz](#-lizenz)

---

## 🎯 Überblick

Courierly ist eine vollständige Transport-Management-Plattform, die Kunden, Auftragnehmer und Mitarbeiter verbindet. Mit Echtzeit-Routing über OSRM, automatischer Preisberechnung mit Mindestlohn-Garantie und einem modernen Design-System.

### 🌟 Highlights

- ⚡ **Echtzeit-Routing**: OSRM-Integration für präzise Routen & Fahrzeiten mit Verkehrsberücksichtigung
- 💰 **Dynamische Preiskalkulation**: Admin kann alle Parameter ohne Code-Änderungen anpassen
- 🔒 **Mindestlohn-Validierung**: Echtzeit-Prüfung verhindert Unterschreitung des Mindestlohns
- 🗺️ **Interaktive Karten**: Leaflet.js mit vollständiger Routenvisualisierung
- 📊 **Reporting & Abrechnungen**: Zeitraum-Filter, CSV-Export, Sammelrechnungen
- 📄 **Professionelle Rechnungen**: MwSt-Berechnung, editierbare Felder, PDF-Vorschau
- 🔴 **Intelligentes Stornierungssystem**: AGB-konforme Gebühren, automatische Preisanpassungen
- ⚖️ **Rechtliche Compliance**: AGB, Widerrufsbelehrung, Consent-Tracking
- 📱 **Responsive Design**: Optimiert für Desktop, Tablet & Mobile
- 🎨 **Modernes UI**: Komplettes CI/CD Design-System mit professionellem Logo
- 🔐 **Sicheres Login**: JWT-basierte Authentifizierung mit 4 Rollen-Typen
- 🔒 **Datenschutz**: Auftragnehmer sehen nur PLZ bis zur Auftragsannahme
- 📄 **CMR-Frachtbriefe**: Automatische PDF-Generierung mit QR-Codes
- ✍️ **Digitale Signaturen**: Touch-optimierte Unterschrifts-Erfassung
- 🏢 **Firmendaten-Verwaltung**: Vollständige Rechnungsinformationen für B2B & B2C
- 👥 **Admin-Vollzugriff**: Komplette Kunden- & Auftragnehmer-Verwaltung

---

## 🚀 Features

### 💰 Dynamische Preiskalkulation (Admin)
- **Vollständig konfigurierbar ohne Code-Änderungen**
  - Distanzpreise (unter/über 100km)
  - Stundensatz (Mindestlohn)
  - Startgebühr, Extra-Stop-Gebühr
  - Plattform-Provision (Standard: 15%)
  - Wartezeit-Parameter (Inklusivzeit, Preis pro 5 Min)
  
- **Live-Updates**
  - Änderungen gelten sofort für neue Aufträge
  - Bestehende Aufträge behalten alte Preise
  - Minimum-Price-Tracking
  
- **Reset-Funktion**
  - Zurück zu Standard-Werten
  - Sicherheitsabfrage

### 📊 Reporting & Abrechnungssystem
- **Zeitraum-Filter**
  - 7, 14, 30 Tage oder Custom
  - Automatische Zusammenfassungen
  
- **Für alle Rollen**
  - Kunden: Ihre Kosten
  - Auftragnehmer: Ihre Einnahmen
  - Admin: Gesamtumsatz + Provision
  
- **Sammelrechnungen (Admin)**
  - Mehrere Aufträge eines Kunden kombinieren
  - Kunden-Filter
  - CSV-Export
  
- **Einzelrechnungen**
  - Pro Auftrag
  - Direkt an Kunde senden

### 📄 Professionelle Rechnungen
- **Vollständiger Rechnungskopf**
  - Firmenadresse, USt-IdNr
  - Geschäftsführer, Amtsgericht
  
- **Editierbare Felder**
  - Rechnungsnummer (klickbar)
  - Rechnungsdatum (klickbar)
  
- **MwSt-Berechnung**
  - 19% MwSt (umschaltbar)
  - Kleinunternehmer-Option (§19 UStG)
  - Netto/Brutto-Ausweisung
  
- **Zahlungsinformationen**
  - IBAN, BIC, Bank
  - Zahlungsziel (14 Tage)
  - Verwendungszweck
  
- **PDF-Vorschau**
  - Vor Versand prüfen
  - "Jetzt senden" oder "Abbrechen"

### ⚖️ Rechtliche Compliance
- **AGB-Seite** (`/agb`)
  - Alle 12 Abschnitte
  - Stornierungsregeln
  - Haftung & Versicherung
  - Gerichtsstand
  
- **Widerrufsbelehrung** (`/widerruf`)
  - 14-Tage-Widerrufsrecht
  - Muster-Widerrufsformular
  - Verbraucherpflichten
  - Erlöschen des Widerrufsrechts
  
- **Footer mit Links**
  - AGB, Widerrufsbelehrung
  - Datenschutz, Impressum
  - Kontaktinformationen
  
- **Widerrufsrecht-Zustimmung**
  - Checkbox bei Auftragserteilung (Privatkunden)
  - Aktive Zustimmung erforderlich
  - Consent-Tracking (IP, Timestamp)
  - § 356 Abs. 4 BGB konform

### 🔴 Intelligentes Stornierungssystem
- **Kunden-Stornierung (Automatisch nach AGB)**
  - >24h vor Abholung: 0% (Kostenlos)
  - <24h vor Abholung: 50% Gebühr
  - Fahrer unterwegs: 75% Gebühr
  - Automatische Berechnung
  - Vorschau vor Stornierung
  
- **Fahrer unterwegs?**
  - Auftrag wird auf 75% reduziert
  - Fahrer kann abschließen
  - Bekommt 85% vom reduzierten Preis
  
- **Auftragnehmer-Stornierung (Admin-gesteuert)**
  - AGB-Gebühren gelten (50% oder 75%)
  - Auftragnehmer zahlt Strafe
  - Admin kann Preis erhöhen (max. = Strafe)
  - Auftrag wird auf 'pending' gesetzt
  - Verfügbar für neue Auftragnehmer
  
- **Audit-Trail**
  - Alle Stornierungen protokolliert
  - Wer, wann, warum
  - Finanzielle Beträge
  - Admin-Notizen

### 🎨 Design & UX
- **Komplettes CI/CD Design-System**
  - Custom Logo mit Blitz-Icon (Geschwindigkeit)
  - Farbpalette: Sky Blue (#0ea5e9) + Amber (#f59e0b)
  - Google Fonts: Poppins (Display) + Inter (Body)
  - Animationen: Fade-in, Slide-up, Bounce
  - Shadows: Soft, Medium, Strong
  
- **Landing Page**
  - Hero-Section mit animiertem Hintergrund
  - Statistiken (1000+ Transporte, 24/7, 99% Zufriedenheit)
  - Features-Sektion mit Hover-Effekten
  - Preiskalkulator mit Echtzeit-Berechnung
  - Login/Logout-Buttons

### ⚙️ Settings & Profil-Verwaltung
- **Profil-Einstellungen**
  - Vorname, Nachname, Email, Telefon bearbeiten
  - **Privat/Firma Toggle**: Unterscheidung zwischen Privatkunden & Firmenkunden
  - **Firmendaten für Rechnungsstellung**:
    - Firmenname, Adresse, PLZ, Stadt, Land
    - Steuernummer (optional)
    - USt-IdNr (optional)
  - **Auto-Fill**: Firmendaten werden automatisch in Aufträge übernommen
  - Passwort ändern mit Bestätigung
  
- **Auftragnehmer-Verifizierung** 🔐
  - **Dokument-Upload**: Transportversicherung + Gewerbeanmeldung (PDF, max. 5 MB)
  - **Dateigrößen-Validierung**: Automatische Prüfung vor Upload
  - **Mindestlohn-Erklärung**: Digitale Checkbox mit Zeitstempel
  - **Admin-Prüfung**: Dokumente werden im Admin-Dashboard angezeigt
  - **Freigabe-Prozess**: Admin kann freigeben, ablehnen oder zurücksetzen
  - **Jährliche Kontrolle**: Verifizierung kann zurückgesetzt werden (Account bleibt erhalten)
  - **Status-Tracking**: Pending → Approved → Rejected
  - **Bewerbungs-Sperre**: Nur verifizierte Auftragnehmer können sich bewerben

### 🗺️ Routing & Preisberechnung
- **OSRM-Integration**
  - Echte Straßenrouten (kein Luftlinie!)
  - Präzise Distanz-Berechnung
  - Realistische Fahrzeiten
  - Verkehrsberücksichtigung (Stoßzeiten +20%)
  
- **Mindestlohn-Garantie mit Echtzeit-Validierung**
  - Formel: (Distanz × €0,50) + (Fahrzeit × €18/h)
  - **Automatische Preis-Vorschläge**: System berechnet empfohlenen Preis (+20%)
  - **Echtzeit-Validierung**: Sofortige Warnung bei Unterschreitung
  - **Visuelles Feedback**: Rotes Eingabefeld + detaillierte Fehlermeldung
  - **Submit-Blockierung**: Auftrag kann nicht erstellt werden wenn Mindestlohn unterschritten
  - **Transparente Berechnung**: Zeigt genaue Formel und Differenz
  - **Lokaler Fallback**: Funktioniert auch wenn Backend offline ist

### 👥 Rollen-Management
- **Kunde (Customer)**
  - Aufträge erstellen & verwalten
  - Preisberechnung
  - CMR-Dokumente einsehen
  - Eigene Auftragshistorie
  - Profil & Passwort ändern

- **Auftragnehmer (Contractor)** 🚚
  - **Bewerbungssystem**: Auf Aufträge bewerben mit eigenem Preis (max. 85% des Kundenpreises)
  - **Verifizierung erforderlich**: Dokumente hochladen für Admin-Freigabe
  - **Datenschutz**: Sieht nur PLZ vor Bewerbungs-Akzeptanz
  - **Nach Akzeptanz**: Vollständige Adressen, Kontaktdaten, alle Details
  - **Abholungs-Workflow**: Button "Paket abholen" → Unterschriften sammeln → Status-Update
  - **Zustellungs-Workflow**: Button "Zustellung abschließen" → Empfänger-Unterschrift → Auftrag abgeschlossen
  - **CMR-Dokumente**: Anzeigen und herunterladen
  - Mitarbeiter verwalten & Aufträge zuweisen
  - **Alle Mitarbeiter-Aufträge sehen**
  - PLZ-basierte Benachrichtigungen konfigurieren
  - Vollständige Preise sichtbar
  - Profil & Passwort ändern

- **Mitarbeiter (Employee)**
  - Nur eigene zugewiesene Aufträge sehen
  - **Preise NICHT sichtbar** (Datenschutz)
  - CMR-Dokumente einsehen
  - Eigenes Dashboard
  - Unterschriften sammeln
  - Profil & Passwort ändern

- **Administrator** 👨‍💼
  - **Alle Aufträge & Benutzer**: Vollständige Übersicht
  - **Bewerbungs-Management**: 
    - Bewerbungen ansehen mit Preis & Marge
    - Akzeptieren → CMR wird automatisch erstellt
    - Ablehnen mit Begründung
  - **Verifizierungs-Management**:
    - Tab "Ausstehende Verifizierungen" → Dokumente prüfen
    - Tab "Alle Auftragnehmer" → Komplette Übersicht
    - Dokumente als PDF anzeigen (Base64)
    - Freigeben, Ablehnen oder Zurücksetzen
    - Passwort zurücksetzen für Benutzer
  - **Kunden-Verwaltung** 🆕:
    - Tab "Kunden" → Alle Kunden (Privat & Firma)
    - **Firmendaten ansehen**: Adresse, Steuer-Nr, USt-ID
    - **Bearbeiten**: Alle Kundendaten editierbar
    - **Account-Status**: Aktivieren/Deaktivieren
    - **Aufträge filtern**: Nur Aufträge des jeweiligen Kunden
  - **Detaillierte Auftragsansicht** 🆕:
    - Vollständige Kunden- & Auftragnehmer-Informationen
    - Alle Firmendaten für Rechnungsstellung
    - Routendetails, Sendungsdetails, Preisinformationen
  - **Rechnungs-Generator** 🆕:
    - Professionelle PDF-Rechnungen erstellen
    - Automatische Übernahme aller Firmendaten
    - Netto/Brutto-Berechnung (19% MwSt.)
    - Druckfunktion
  - **Aufträge zuweisen**: An Auftragnehmer oder Mitarbeiter
  - **System-Verwaltung**: Alle Funktionen
  - Profil & Passwort ändern

### 📄 CMR-Frachtbriefe & Digitale Unterschriften
- **Automatische CMR-Erstellung**: Bei Bewerbungs-Akzeptanz durch Admin
- **PDF-Generierung**: Vollständiges CMR-Dokument mit QR-Code
- **Intelligenter Abholungs-Workflow**:
  1. **Button "Paket abholen"** → Modal öffnet sich
  2. **Absender-Name eingeben** + Unterschrift auf Canvas
  3. **Frachtführer unterschreibt** (Name automatisch aus Profil)
  4. **Beide Unterschriften werden gespeichert**
  5. **Status → "picked_up"** (Abgeholt)
  6. **CMR-PDF wird neu generiert** mit beiden Unterschriften
  7. **Email an Kunde**: "Paket abgeholt - unterwegs"
  
- **Intelligenter Zustellungs-Workflow**:
  1. **Button "Zustellung abschließen"** → Modal öffnet sich
  2. **Empfänger-Name eingeben** + Unterschrift auf Canvas
  3. **Empfänger-Unterschrift wird gespeichert**
  4. **Status → "delivered"** (Zugestellt)
  5. **CMR-PDF wird finalisiert** mit allen 3 Unterschriften
  6. **Email an Kunde**: "Paket zugestellt" + CMR-PDF im Anhang
  7. **Auftrag → "Abgeschlossen"** (in Historie verschoben)
  
- **Features**:
  - ✍️ **Touch-optimierte Unterschriften**: Canvas mit react-signature-canvas
  - 📱 **Mobile-First**: Optimiert für Smartphone-Nutzung
  - 🔒 **Sichere Speicherung**: Base64-Signaturen in Datenbank
  - 📧 **Automatische Benachrichtigungen**: Kunde wird bei jedem Schritt informiert
  - 📄 **Vollständiges CMR**: Alle Unterschriften + Zeitstempel
  - 🚫 **Validierung**: Keine leeren Unterschriften möglich

### 🏢 Firmendaten & Rechnungsstellung
- **Privat/Firma Toggle**:
  - Kunden können zwischen Privatkunde & Firmenkunde wählen
  - Firmenkunden: Erweiterte Felder für Rechnungsdaten
  - Privatkunden: Einfache Kontaktdaten
  
- **Firmendaten-Erfassung**:
  - Firmenname (Pflichtfeld für Firmenkunden)
  - Vollständige Adresse (Straße, PLZ, Stadt, Land)
  - Steuernummer (optional)
  - USt-IdNr (optional)
  - Telefon & Email
  
- **Auto-Fill in Aufträgen**:
  - Firmendaten werden automatisch in Pickup-Felder übernommen
  - Kunde kann Daten für Drittpartei-Buchungen überschreiben
  - Spart Zeit bei wiederkehrenden Aufträgen
  
- **Admin-Ansicht**:
  - Alle Firmendaten für Rechnungsstellung sichtbar
  - Bearbeitung durch Admin möglich
  - Unterscheidung zwischen Privat- & Firmenkunden
  
- **Rechnungs-Generator** 🧾:
  - **Automatische Datenübernahme**: Alle Firmendaten aus Auftrag
  - **Professionelles Layout**: Firmen-Header, Rechnungsempfänger, Leistungserbringer
  - **MwSt.-Berechnung**: Automatisch 19% MwSt. auf Nettobetrag
  - **Detaillierte Positionen**: Transportdetails, Distanz, Fahrzeit, Wartezeit
  - **Bankverbindung**: Zahlungsinformationen inkl. IBAN
  - **Druckfunktion**: PDF-ready HTML für direkten Druck
  - **Anpassbar**: Rechnungsnummer & Datum editierbar

- **MwSt.-Anzeige**:
  - Alle Preise für Kunden: "€228.89 (zzgl. 19% MwSt.)"
  - Transparente Preisdarstellung
  - Rechtlich korrekt für B2B & B2C

### 🔔 Benachrichtigungen
- Email-Benachrichtigungen (optional)
- PLZ-basierte Auftrags-Alerts
- Status-Updates
- Auftrags-Zuweisung

### 📦 Smart Defaults & Automatisierung
- **Europalette-Standard**:
  - Maße: 120cm × 80cm × 15cm (vorausgefüllt)
  - Gewicht: 100kg (Standard)
  - Paletten: 1 Stück
  - Kunde kann alle Werte ändern
  
- **Direktfahrt-Standard**:
  - Zustellung: Gleiches Datum wie Abholung
  - Uhrzeit: Gleiche Zeit wie Abholung
  - Hinweis: "Direktfahrt" wird angezeigt
  - Kunde kann auf späteren Termin ändern
  
- **Automatische Preisberechnung**:
  - Preis wird bei Routenberechnung automatisch gesetzt
  - Basiert auf Mindestlohn-Formel
  - Empfohlener Preis (+20% Aufschlag)
  - Kunde kann Preis anpassen (mit Validierung)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Datenbank**: PostgreSQL 14+
- **Authentifizierung**: JWT (jsonwebtoken)
- **Email**: Nodemailer (optional)
- **PDF**: PDFKit
- **QR-Codes**: qrcode
- **Validierung**: express-validator

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS 3
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Karten**: Leaflet.js + React-Leaflet
- **HTTP**: Fetch API
- **State**: React Hooks (useState, useEffect, useContext)

### APIs & Services
- **Routing**: OSRM (OpenStreetMap Routing Machine)
- **Geocoding**: Nominatim (OpenStreetMap)
- **Karten**: OpenStreetMap Tiles

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Datenbank**: Railway PostgreSQL

---

## 💻 Installation

### Voraussetzungen
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Git ([Download](https://git-scm.com/))

### 1️⃣ Repository klonen
```bash
git clone https://github.com/florianbrach74-stack/courierly-transport-app.git
cd courierly-transport-app
```

### 2️⃣ Abhängigkeiten installieren
```bash
# Root + Client + Server
npm run install-all

# Oder manuell:
npm install
cd client && npm install
```

### 3️⃣ Datenbank einrichten
```bash
# PostgreSQL Datenbank erstellen
createdb courierly_db

# Schema initialisieren
psql courierly_db < setup_database.sql
```

### 4️⃣ Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```env
# Datenbank
DATABASE_URL=postgresql://user:password@localhost:5432/courierly_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email (Optional - System funktioniert auch ohne)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@courierly.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 5️⃣ Entwicklungsserver starten
```bash
# Beide Server gleichzeitig starten
npm run dev

# Oder separat:
npm run server  # Backend auf :5000
npm run client  # Frontend auf :5173
```

### 6️⃣ Anwendung öffnen
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

### 7️⃣ Test-Accounts

**Admin:**
```
Email: admin@courierly.com
Passwort: admin123
```

**Firmenkunde (mit vollständigen Firmendaten):**
```
Email: testkunde@firma.de
Passwort: test123
Firma: Test Transport GmbH
```

**Auftragnehmer:**
```
Email: contractor@example.com
Passwort: contractor123
```

---

## 📁 Projekt-Struktur

```
courierly-transport-app/
├── client/                          # React Frontend
│   ├── public/                      # Statische Dateien
│   ├── src/
│   │   ├── components/              # Wiederverwendbare Komponenten
│   │   │   ├── AddressSearch.jsx   # Adress-Autocomplete
│   │   │   ├── RouteMap.jsx        # Karten-Komponente
│   │   │   ├── Logo.jsx            # Courierly Logo
│   │   │   ├── Navbar.jsx          # Navigation
│   │   │   ├── CreateOrderModal.jsx
│   │   │   └── ...
│   │   ├── pages/                   # Seiten
│   │   │   ├── LandingPage.jsx     # Startseite
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── ContractorDashboard.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/                # API Services
│   │   │   └── api.js              # API Calls
│   │   ├── context/                 # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx                  # Main App
│   │   └── main.jsx
│   ├── tailwind.config.js           # TailwindCSS Config
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── config/
│   │   └── database.js             # DB Connection
│   ├── controllers/
│   │   ├── authController.js       # Auth Logic
│   │   └── orderController.js      # Order Logic
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT Verification
│   ├── models/
│   │   ├── User.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js                 # Auth Routes
│   │   ├── orders.js               # Order Routes
│   │   ├── pricing.js              # Pricing Routes
│   │   ├── contractors.js          # Contractor Routes
│   │   └── ...
│   ├── utils/
│   │   ├── emailService.js         # Email Notifications
│   │   ├── priceCalculator.js      # Price Logic
│   │   └── cmrGenerator.js         # CMR PDF
│   └── index.js                    # Server Entry
│
├── setup_database.sql               # DB Schema
├── package.json                     # Root Package
└── README.md
```

---

## 🌐 Deployment

### Frontend (Vercel)

1. **Vercel mit GitHub verbinden**
2. **Build Settings:**
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   ```
3. **Umgebungsvariablen:**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

### Backend (Railway)

1. **Railway Projekt erstellen**
2. **PostgreSQL hinzufügen**
3. **Umgebungsvariablen setzen:**
   ```
   DATABASE_URL=<automatisch von Railway>
   JWT_SECRET=<your-secret>
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. **Deploy:** Automatisch bei Git Push

---

## 📡 API Dokumentation

### Authentifizierung

#### Registrierung
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "Max",
  "last_name": "Mustermann",
  "role": "customer",
  "phone": "+49 123 456789"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": { ... }
}
```

### Aufträge

#### Alle Aufträge abrufen (Rollen-basiert)
```http
GET /api/orders
Authorization: Bearer <token>

Response:
{
  "orders": [...]
}
```

#### Neuen Auftrag erstellen
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickup_address": "Hauptstraße 1",
  "pickup_city": "Berlin",
  "pickup_postal_code": "10115",
  "delivery_address": "Bahnhofstraße 5",
  "delivery_city": "München",
  "delivery_postal_code": "80335",
  "pickup_date": "2025-01-30",
  "vehicle_type": "Kleintransporter",
  "price": 250.00
}
```

#### Auftrag annehmen
```http
PUT /api/orders/:id/accept
Authorization: Bearer <token>
```

### Preisberechnung

#### Preis berechnen
```http
POST /api/pricing/calculate
Content-Type: application/json

{
  "distanceKm": 584,
  "durationMinutes": 383
}

Response:
{
  "success": true,
  "minimumPrice": 406.84,
  "recommendedPrice": 488.21,
  "distanceCost": 292.00,
  "timeCost": 114.84,
  "breakdown": {
    "perKm": 0.50,
    "perHour": 18.00
  }
}
```

#### Preis validieren
```http
POST /api/pricing/validate
Content-Type: application/json

{
  "proposedPrice": 450.00,
  "distanceKm": 584,
  "durationMinutes": 383
}

Response:
{
  "success": true,
  "isValid": true,
  "minimumPrice": 406.84,
  "proposedPrice": 450.00,
  "difference": 43.16,
  "message": "Preis ist akzeptabel und hält Mindestlohn ein"
}
```

---

## 🎨 Design System

### Farben
```css
/* Primary - Sky Blue */
--primary-500: #0ea5e9;
--primary-600: #0284c7;
--primary-700: #0369a1;

/* Secondary - Amber */
--secondary-400: #f59e0b;
--secondary-500: #d97706;

/* Success - Green */
--success-500: #22c55e;
--success-600: #16a34a;
```

### Typografie
```css
/* Display (Headlines) */
font-family: 'Poppins', sans-serif;
font-weight: 600-900;

/* Body (Text) */
font-family: 'Inter', sans-serif;
font-weight: 400-600;
```

### Komponenten

#### Button Primary
```jsx
<button className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-strong hover:shadow-xl transform hover:-translate-y-1">
  Button Text
</button>
```

#### Card
```jsx
<div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-all">
  Card Content
</div>
```

---

## 👥 Benutzerrollen

| Rolle | Rechte | Dashboard | Preise sichtbar |
|-------|--------|-----------|-----------------|
| **Customer** | Aufträge erstellen | Eigene Aufträge | ✅ Ja |
| **Contractor** | Aufträge annehmen, Mitarbeiter verwalten | Eigene + Mitarbeiter-Aufträge | ✅ Ja |
| **Employee** | Zugewiesene Aufträge | Nur eigene Aufträge | ❌ Nein |
| **Admin** | Alles | Alle Aufträge & Benutzer | ✅ Ja |

---

## 🔧 Entwicklung

### NPM Scripts
```bash
npm run dev          # Start both servers
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build frontend
npm run install-all  # Install all dependencies
```

### Datenbank Migrations
```bash
# Schema neu laden
psql courierly_db < setup_database.sql

# Backup erstellen
pg_dump courierly_db > backup.sql
```

---

## 🐛 Troubleshooting

### Backend crasht
- Prüfen Sie `DATABASE_URL` in `.env`
- Prüfen Sie ob PostgreSQL läuft: `pg_isready`
- Logs prüfen: `npm run server`

### Frontend kann Backend nicht erreichen
- Prüfen Sie `VITE_API_URL` in `.env`
- CORS-Einstellungen prüfen
- Backend läuft auf Port 5000?

### Email-Service funktioniert nicht
- Email-Service ist **optional**
- System funktioniert auch ohne
- Prüfen Sie Email-Credentials in `.env`

---

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei

---

## 👨‍💻 Entwickler

Entwickelt mit ❤️ für moderne Transport-Logistik

**Live Demo:** [courierly-transport.vercel.app](https://courierly-transport.vercel.app)

---

<div align="center">

**📦 Courierly - Express Delivery leicht gemacht**

</div>
