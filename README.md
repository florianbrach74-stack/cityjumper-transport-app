# 🚚 CityJumper - Transport Management Platform

<div align="center">

![CityJumper Logo](https://img.shields.io/badge/CityJumper-Express%20Transport-0ea5e9?style=for-the-badge&logo=truck&logoColor=white)

**Moderne Transport- und Kurierdienst-Plattform mit Echtzeit-Routing & Mindestlohn-Garantie**

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=flat-square)](https://cityjumper-transport.vercel.app)
[![Backend](https://img.shields.io/badge/API-Railway-blueviolet?style=flat-square)](https://cityjumper-api-production-01e4.up.railway.app)
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

CityJumper ist eine vollständige Transport-Management-Plattform, die Kunden, Auftragnehmer und Mitarbeiter verbindet. Mit Echtzeit-Routing über OSRM, automatischer Preisberechnung mit Mindestlohn-Garantie und einem modernen CI/CD Design-System.

### 🌟 Highlights

- ⚡ **Echtzeit-Routing**: OSRM-Integration für präzise Routen & Fahrzeiten
- 💰 **Faire Preise**: Automatische Berechnung mit Mindestlohn-Prüfung (18€/h + 0,50€/km)
- 🗺️ **Interaktive Karten**: Leaflet.js mit vollständiger Routenvisualisierung
- 📱 **Responsive Design**: Optimiert für Desktop, Tablet & Mobile
- 🎨 **Modernes UI**: Komplettes CI/CD Design-System mit Logo & Animationen
- 🔐 **Sicheres Login**: JWT-basierte Authentifizierung mit Rollen-Management
- 📄 **CMR-Frachtbriefe**: Automatische PDF-Generierung mit QR-Codes
- ✍️ **Digitale Signaturen**: Touch-optimierte Unterschrifts-Erfassung

---

## 🚀 Features

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

### 🗺️ Routing & Preisberechnung
- **OSRM-Integration**
  - Echte Straßenrouten (kein Luftlinie!)
  - Präzise Distanz-Berechnung
  - Realistische Fahrzeiten
  - Verkehrsberücksichtigung (Stoßzeiten +20%)
  
- **Mindestlohn-Garantie**
  - Formel: (Distanz × €0,50) + (Fahrzeit × €18/h)
  - Automatische Validierung
  - Empfohlener Preis (+20% Aufschlag)
  - Transparente Aufschlüsselung

### 👥 Rollen-Management
- **Kunde (Customer)**
  - Aufträge erstellen & verwalten
  - Preisberechnung
  - CMR-Dokumente einsehen
  - Eigene Auftragshistorie

- **Auftragnehmer (Contractor)**
  - Aufträge annehmen
  - Mitarbeiter verwalten
  - **Alle Mitarbeiter-Aufträge sehen**
  - Benachrichtigungen konfigurieren
  - Vollständige Preise sichtbar

- **Mitarbeiter (Employee)**
  - Nur eigene Aufträge sehen
  - **Preise NICHT sichtbar**
  - CMR-Dokumente
  - Eigenes Dashboard

- **Administrator**
  - Alle Aufträge & Benutzer
  - Aufträge zuweisen
  - System-Verwaltung

### 📄 CMR-Frachtbriefe
- Automatische PDF-Generierung
- QR-Code für Tracking
- Digitale Unterschriften
- Mobile-optimiert
- Download & Email-Versand

### 🔔 Benachrichtigungen
- Email-Benachrichtigungen (optional)
- PLZ-basierte Auftrags-Alerts
- Status-Updates
- Auftrags-Zuweisung

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
git clone https://github.com/florianbrach74-stack/cityjumper-transport-app.git
cd cityjumper-transport-app
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
createdb cityjumper_db

# Schema initialisieren
psql cityjumper_db < setup_database.sql
```

### 4️⃣ Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```env
# Datenbank
DATABASE_URL=postgresql://user:password@localhost:5432/cityjumper_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email (Optional - System funktioniert auch ohne)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@cityjumper.com

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

---

## 📁 Projekt-Struktur

```
cityjumper-transport-app/
├── client/                          # React Frontend
│   ├── public/                      # Statische Dateien
│   ├── src/
│   │   ├── components/              # Wiederverwendbare Komponenten
│   │   │   ├── AddressSearch.jsx   # Adress-Autocomplete
│   │   │   ├── RouteMap.jsx        # Karten-Komponente
│   │   │   ├── Logo.jsx            # CityJumper Logo
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
psql cityjumper_db < setup_database.sql

# Backup erstellen
pg_dump cityjumper_db > backup.sql
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

**Live Demo:** [cityjumper-transport.vercel.app](https://cityjumper-transport.vercel.app)

---

<div align="center">

**⚡ CityJumper - Express Transport leicht gemacht**

</div>
