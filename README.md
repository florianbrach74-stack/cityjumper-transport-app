# CityJumper Transport Management Platform

Eine moderne Web-Applikation für Transport- und Kurierdienste, die es Auftraggebern ermöglicht, Transporte einzustellen und Subunternehmen/Mitarbeitern, diese anzunehmen.

## Features

- 🚚 **Auftragsmanagement**: Kunden können Transportaufträge erstellen
- 👷 **Auftragnehmer-Portal**: Subunternehmen und Mitarbeiter können Aufträge annehmen
- 📄 **CMR-Frachtbriefe**: Automatische Erstellung internationaler Frachtbriefe
- ✍️ **Digitale Unterschriften**: Mobile-optimierte Unterschrifts-Erfassung
- 📧 **Email-Benachrichtigungen**: Automatische Benachrichtigungen bei allen wichtigen Events
- 🔐 **Authentifizierung**: Sichere Login-Systeme für Kunden und Auftragnehmer
- 💾 **Datenbank**: PostgreSQL für zuverlässige Datenspeicherung
- 📱 **Responsive Design**: Moderne UI mit React und TailwindCSS

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Nodemailer für Email-Versand

### Frontend
- React + Vite
- TailwindCSS
- Lucide Icons
- React Router

## Installation

1. **Abhängigkeiten installieren**
```bash
npm run install-all
```

2. **PostgreSQL Datenbank einrichten**
```bash
# PostgreSQL starten und Datenbank erstellen
createdb zipmend_db

# Datenbank-Schema initialisieren
psql zipmend_db < server/database/schema.sql
```

3. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Datenbank- und Email-Credentials
```

4. **Entwicklungsserver starten**
```bash
npm run dev
```

Die Anwendung läuft auf:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Projekt-Struktur

```
windsurf-project/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React Komponenten
│   │   ├── pages/         # Seiten (Dashboard, Login, etc.)
│   │   ├── services/      # API Services
│   │   └── App.jsx
│   └── package.json
├── server/                # Node.js Backend
│   ├── config/           # Konfiguration
│   ├── controllers/      # Route Controller
│   ├── middleware/       # Auth Middleware
│   ├── models/          # Datenbank Models
│   ├── routes/          # API Routes
│   ├── database/        # DB Schema
│   └── index.js
└── package.json

```

## API Endpoints

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer login

### Aufträge
- `GET /api/orders` - Alle Aufträge abrufen
- `POST /api/orders` - Neuen Auftrag erstellen
- `PUT /api/orders/:id/accept` - Auftrag annehmen
- `GET /api/orders/my-orders` - Eigene Aufträge

## Email-Benachrichtigungen

Das System sendet automatisch Emails bei:
- ✅ Auftragserstellung (an Auftraggeber)
- ✅ Auftragsannahme (an Auftragnehmer und Auftraggeber)

## Benutzerrollen

- **Kunde (Customer)**: Kann Transportaufträge erstellen und verwalten
- **Auftragnehmer (Contractor)**: Kann verfügbare Aufträge sehen und annehmen

## Lizenz

MIT
