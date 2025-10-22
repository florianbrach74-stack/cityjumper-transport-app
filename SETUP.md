# ZipMend Transport Management - Setup Anleitung

## Voraussetzungen

- Node.js (v16 oder höher)
- PostgreSQL (v12 oder höher)
- npm oder yarn

## Schritt-für-Schritt Installation

### 1. Abhängigkeiten installieren

```bash
# Im Hauptverzeichnis
npm run install-all
```

Dieser Befehl installiert alle Abhängigkeiten für Backend und Frontend.

### 2. PostgreSQL Datenbank einrichten

#### Option A: Mit psql (Kommandozeile)

```bash
# PostgreSQL starten (macOS mit Homebrew)
brew services start postgresql@14

# PostgreSQL Datenbank erstellen
createdb zipmend_db

# Schema importieren (Basis-Schema)
psql zipmend_db < server/database/schema.sql

# CMR-Schema importieren (für Frachtbriefe)
psql zipmend_db < server/database/cmr_schema.sql
```

#### Option B: Mit pgAdmin oder einem anderen GUI-Tool

1. Öffnen Sie pgAdmin
2. Erstellen Sie eine neue Datenbank namens `zipmend_db`
3. Öffnen Sie das Query Tool
4. Führen Sie den Inhalt von `server/database/schema.sql` aus

### 3. Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env
```

Bearbeiten Sie die `.env` Datei mit Ihren Daten:

```env
# Datenbank
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zipmend_db
DB_USER=postgres
DB_PASSWORD=IhrPostgresPasswort

# JWT Secret (ändern Sie dies!)
JWT_SECRET=IhrSicheresGeheimnis123!

# Email (Gmail Beispiel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ihre.email@gmail.com
EMAIL_PASSWORD=IhrAppPasswort
EMAIL_FROM=noreply@zipmend.com

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4. Email-Konfiguration (Gmail Beispiel)

Für Gmail benötigen Sie ein App-Passwort:

1. Gehen Sie zu https://myaccount.google.com/security
2. Aktivieren Sie die 2-Faktor-Authentifizierung
3. Gehen Sie zu "App-Passwörter"
4. Erstellen Sie ein neues App-Passwort für "Mail"
5. Verwenden Sie dieses Passwort in der `.env` Datei

**Alternative Email-Dienste:**
- **Mailgun**: Professioneller Service für Transaktions-Emails
- **SendGrid**: Kostenloser Tier verfügbar
- **Amazon SES**: Günstig für hohe Volumina

### 5. Anwendung starten

```bash
# Entwicklungsmodus (Backend + Frontend gleichzeitig)
npm run dev
```

Die Anwendung ist nun verfügbar unter:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

### 6. Testbenutzer erstellen

Sie können sich über die Registrierungsseite anmelden:

**Kunde (Auftraggeber):**
- Wählen Sie "Kunde" bei der Registrierung
- Kann Transportaufträge erstellen

**Auftragnehmer (Subunternehmen):**
- Wählen Sie "Auftragnehmer" bei der Registrierung
- Kann verfügbare Aufträge sehen und annehmen

## Troubleshooting

### Datenbank-Verbindungsfehler

```bash
# Prüfen Sie, ob PostgreSQL läuft
brew services list

# PostgreSQL neu starten
brew services restart postgresql@14

# Verbindung testen
psql -U postgres -d zipmend_db -c "SELECT 1;"
```

### Port bereits in Verwendung

```bash
# Backend Port (5000) prüfen
lsof -ti:5000 | xargs kill -9

# Frontend Port (5173) prüfen
lsof -ti:5173 | xargs kill -9
```

### Email-Versand funktioniert nicht

1. Prüfen Sie die Email-Credentials in `.env`
2. Stellen Sie sicher, dass 2FA aktiviert ist (bei Gmail)
3. Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort
4. Prüfen Sie die Firewall-Einstellungen

### Module nicht gefunden

```bash
# Alle node_modules löschen und neu installieren
rm -rf node_modules client/node_modules
npm run install-all
```

## Produktions-Deployment

### Umgebungsvariablen für Produktion

```env
NODE_ENV=production
CLIENT_URL=https://ihre-domain.de
JWT_SECRET=EinSehrLangesUndSicheresGeheimnis!
```

### Build erstellen

```bash
# Frontend bauen
cd client
npm run build

# Der Build-Ordner enthält die statischen Dateien
```

### Empfohlene Hosting-Optionen

**Backend:**
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Railway

**Datenbank:**
- Heroku Postgres
- DigitalOcean Managed Databases
- AWS RDS
- Supabase

**Frontend:**
- Vercel
- Netlify
- Cloudflare Pages

## Nächste Schritte

1. ✅ Registrieren Sie sich als Kunde und Auftragnehmer (zwei verschiedene Accounts)
2. ✅ Erstellen Sie einen Testauftrag als Kunde
3. ✅ Prüfen Sie, ob die Email-Benachrichtigung ankommt
4. ✅ Melden Sie sich als Auftragnehmer an und nehmen Sie den Auftrag an
5. ✅ Prüfen Sie beide Email-Benachrichtigungen

## Support

Bei Fragen oder Problemen:
- Prüfen Sie die Logs in der Konsole
- Überprüfen Sie die Browser-Konsole auf Frontend-Fehler
- Stellen Sie sicher, dass alle Umgebungsvariablen korrekt gesetzt sind
