# 🚀 Courierly Transport App - Quick Start Guide

## 🚀 Schnellstart (5 Minuten)

### 1. Repository klonen
```bash
git clone https://github.com/florianbrach74-stack/courierly-transport-app.git
cd courierly-transport-app
```

### 2. Backend starten
Das Script führt automatisch folgende Schritte aus:
- ✅ Prüft Voraussetzungen (Node.js, PostgreSQL)
- ✅ Installiert alle Abhängigkeiten
- ✅ Erstellt .env Datei
- ✅ Erstellt Datenbank und Schema

### 2. Umgebungsvariablen konfigurieren

Bearbeiten Sie die `.env` Datei:

```env
# Datenbank (anpassen!)
DB_PASSWORD=IhrPostgresPasswort

# JWT Secret (ändern!)
JWT_SECRET=IhrSicheresGeheimnis123!

# Email (anpassen!)
EMAIL_USER=ihre.email@gmail.com
EMAIL_PASSWORD=IhrGmailAppPasswort
```

### 3. Anwendung starten

```bash
npm run dev
```

### 4. Browser öffnen

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

## Erste Schritte

### Als Kunde (Auftraggeber)

1. **Registrieren**
   - Gehen Sie zu http://localhost:5173/register
   - Wählen Sie "Kunde"
   - Füllen Sie das Formular aus
   - Klicken Sie auf "Konto erstellen"

2. **Auftrag erstellen**
   - Klicken Sie auf "Neuen Auftrag erstellen"
   - Füllen Sie Abholinformationen aus
   - Füllen Sie Zustellinformationen aus
   - Wählen Sie Fahrzeugtyp
   - Klicken Sie auf "Auftrag erstellen"
   - ✅ Sie erhalten eine Email-Bestätigung

3. **Aufträge verwalten**
   - Sehen Sie alle Ihre Aufträge im Dashboard
   - Prüfen Sie den Status
   - Sehen Sie, welcher Auftragnehmer den Auftrag angenommen hat

### Als Auftragnehmer (Subunternehmen)

1. **Registrieren**
   - Gehen Sie zu http://localhost:5173/register
   - Wählen Sie "Auftragnehmer"
   - Füllen Sie das Formular aus
   - Klicken Sie auf "Konto erstellen"

2. **Verfügbare Aufträge ansehen**
   - Tab "Verfügbare Aufträge" ist standardmäßig aktiv
   - Sehen Sie alle offenen Aufträge
   - Prüfen Sie Details (Route, Datum, Preis, etc.)

3. **Auftrag annehmen**
   - Klicken Sie auf "Auftrag annehmen"
   - Bestätigen Sie die Annahme
   - ✅ Sie und der Kunde erhalten Email-Benachrichtigungen
   - Der Auftrag erscheint in "Meine Aufträge"

## Nützliche Befehle

```bash
# Nur Backend starten
npm run server

# Nur Frontend starten
npm run client

# Frontend bauen
cd client && npm run build

# Datenbank zurücksetzen
dropdb zipmend_db && createdb zipmend_db
psql zipmend_db < server/database/schema.sql
```

## API Endpoints

### Authentifizierung
```bash
# Registrieren
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "role": "customer",
  "first_name": "Max",
  "last_name": "Mustermann"
}

# Login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# Profil abrufen (benötigt Token)
GET /api/auth/profile
Authorization: Bearer <token>
```

### Aufträge
```bash
# Auftrag erstellen (nur Kunden)
POST /api/orders
Authorization: Bearer <token>

# Eigene Aufträge abrufen
GET /api/orders
Authorization: Bearer <token>

# Verfügbare Aufträge (nur Auftragnehmer)
GET /api/orders/available
Authorization: Bearer <token>

# Auftrag annehmen (nur Auftragnehmer)
PUT /api/orders/:id/accept
Authorization: Bearer <token>
```

## Troubleshooting

### "Cannot connect to database"
```bash
# PostgreSQL starten
brew services start postgresql@14

# Verbindung testen
psql -U postgres -d zipmend_db
```

### "Port 5000 already in use"
```bash
# Port freigeben
lsof -ti:5000 | xargs kill -9
```

### "Email not sending"
- Prüfen Sie EMAIL_USER und EMAIL_PASSWORD in .env
- Bei Gmail: Verwenden Sie ein App-Passwort (nicht Ihr normales Passwort)
- Aktivieren Sie 2-Faktor-Authentifizierung in Gmail

### "Module not found"
```bash
# Neu installieren
rm -rf node_modules client/node_modules
npm run install-all
```

## Test-Daten

### Test-Kunde
```
Email: kunde@test.de
Passwort: test123
Rolle: Kunde
```

### Test-Auftragnehmer
```
Email: auftragnehmer@test.de
Passwort: test123
Rolle: Auftragnehmer
```

*Hinweis: Diese müssen Sie selbst über die Registrierung erstellen*

## Projekt-Struktur

```
windsurf-project/
├── client/              # React Frontend
│   ├── src/
│   │   ├── components/  # UI Komponenten
│   │   ├── pages/       # Seiten
│   │   ├── services/    # API Services
│   │   └── context/     # React Context
│   └── package.json
├── server/              # Node.js Backend
│   ├── config/          # Konfiguration
│   ├── controllers/     # Business Logic
│   ├── middleware/      # Auth Middleware
│   ├── models/          # Datenbank Models
│   ├── routes/          # API Routes
│   └── database/        # DB Schema
├── .env                 # Umgebungsvariablen
├── package.json         # Backend Dependencies
├── README.md            # Hauptdokumentation
├── SETUP.md             # Detaillierte Setup-Anleitung
├── FEATURES.md          # Feature-Übersicht
└── QUICK_START.md       # Diese Datei
```

## Weitere Hilfe

- 📖 Vollständige Dokumentation: `README.md`
- 🔧 Setup-Details: `SETUP.md`
- ✨ Feature-Liste: `FEATURES.md`

## Support

Bei Problemen:
1. Prüfen Sie die Konsolen-Logs (Backend)
2. Prüfen Sie die Browser-Konsole (Frontend)
3. Überprüfen Sie die .env Datei
4. Stellen Sie sicher, dass PostgreSQL läuft
5. Prüfen Sie, ob alle Ports frei sind

Viel Erfolg! 🚀
