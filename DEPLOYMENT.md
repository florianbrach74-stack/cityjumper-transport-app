# 🚀 Deployment-Anleitung - GitHub & Vercel

## Übersicht

Diese Anleitung zeigt Ihnen, wie Sie die ZipMend Transport Management Platform auf GitHub und Vercel veröffentlichen.

## 📋 Voraussetzungen

- GitHub Account
- Vercel Account (kostenlos unter https://vercel.com)
- PostgreSQL Datenbank (z.B. Supabase, Railway, oder Heroku)
- Email-Service (Gmail, Mailgun, SendGrid)

## 🔧 Vorbereitung

### 1. GitHub Repository erstellen

#### Option A: Über GitHub Website

1. Gehen Sie zu https://github.com/new
2. Repository Name: `zipmend-transport-app` (oder Ihr Wunschname)
3. Beschreibung: "Transport Management Platform mit CMR-Frachtbrief-System"
4. Wählen Sie "Private" oder "Public"
5. **NICHT** "Initialize with README" aktivieren
6. Klicken Sie auf "Create repository"

#### Option B: Über GitHub CLI

```bash
gh repo create zipmend-transport-app --private
```

### 2. Lokales Repository initialisieren

```bash
cd /Users/florianbrach/Desktop/Zipemendapp/CascadeProjects/windsurf-project

# Git initialisieren (falls noch nicht geschehen)
git init

# Alle Dateien hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Initial commit: ZipMend Transport Management Platform mit CMR-System"

# Remote hinzufügen (ersetzen Sie USERNAME mit Ihrem GitHub-Benutzernamen)
git remote add origin https://github.com/USERNAME/zipmend-transport-app.git

# Zum GitHub pushen
git branch -M main
git push -u origin main
```

## 🗄️ Datenbank-Setup (Produktion)

### Option 1: Supabase (Empfohlen - Kostenlos)

1. Gehen Sie zu https://supabase.com
2. Erstellen Sie ein neues Projekt
3. Notieren Sie die Connection Details:
   - Host
   - Database
   - User
   - Password
   - Port

4. Führen Sie die SQL-Schemas aus:
   - Öffnen Sie SQL Editor in Supabase
   - Kopieren Sie den Inhalt von `server/database/schema.sql`
   - Führen Sie es aus
   - Kopieren Sie den Inhalt von `server/database/cmr_schema.sql`
   - Führen Sie es aus

### Option 2: Railway

1. Gehen Sie zu https://railway.app
2. Erstellen Sie ein neues Projekt
3. Fügen Sie PostgreSQL hinzu
4. Notieren Sie die Connection String

### Option 3: Heroku Postgres

1. Gehen Sie zu https://heroku.com
2. Erstellen Sie eine neue App
3. Fügen Sie "Heroku Postgres" Add-on hinzu
4. Notieren Sie die DATABASE_URL

## 📧 Email-Service Setup

### Option 1: Gmail (Einfach für Tests)

1. Aktivieren Sie 2-Faktor-Authentifizierung
2. Erstellen Sie ein App-Passwort: https://myaccount.google.com/apppasswords
3. Notieren Sie Email und App-Passwort

### Option 2: SendGrid (Empfohlen für Produktion)

1. Gehen Sie zu https://sendgrid.com
2. Erstellen Sie einen kostenlosen Account
3. Erstellen Sie einen API Key
4. Notieren Sie den API Key

### Option 3: Mailgun

1. Gehen Sie zu https://mailgun.com
2. Erstellen Sie einen Account
3. Verifizieren Sie Ihre Domain
4. Notieren Sie SMTP-Credentials

## 🚀 Vercel Deployment

### 1. Vercel mit GitHub verbinden

1. Gehen Sie zu https://vercel.com
2. Klicken Sie auf "Sign Up" oder "Log In"
3. Wählen Sie "Continue with GitHub"
4. Autorisieren Sie Vercel

### 2. Projekt importieren

1. Klicken Sie auf "Add New..." → "Project"
2. Wählen Sie Ihr GitHub Repository aus
3. Klicken Sie auf "Import"

### 3. Projekt konfigurieren

#### Framework Preset
- **Framework Preset**: Other

#### Build & Output Settings
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

#### Root Directory
- Lassen Sie leer (Root des Repositories)

### 4. Umgebungsvariablen hinzufügen

Klicken Sie auf "Environment Variables" und fügen Sie folgende hinzu:

```env
# Datenbank (von Supabase/Railway/Heroku)
DB_HOST=your-db-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-secure-password

# JWT Secret (generieren Sie einen sicheren String)
JWT_SECRET=your-very-secure-random-string-min-32-characters

# Email (Gmail oder SendGrid)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@zipmend.com

# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-app.vercel.app
```

**Wichtig**: 
- Ersetzen Sie alle Werte mit Ihren echten Credentials
- `CLIENT_URL` wird nach dem ersten Deployment aktualisiert
- Generieren Sie einen sicheren JWT_SECRET (z.B. mit `openssl rand -base64 32`)

### 5. Deploy starten

1. Klicken Sie auf "Deploy"
2. Warten Sie, bis das Deployment abgeschlossen ist (ca. 2-3 Minuten)
3. Notieren Sie die URL (z.B. `your-app.vercel.app`)

### 6. CLIENT_URL aktualisieren

1. Gehen Sie zu Ihrem Projekt in Vercel
2. Klicken Sie auf "Settings" → "Environment Variables"
3. Bearbeiten Sie `CLIENT_URL` mit Ihrer echten Vercel-URL
4. Klicken Sie auf "Redeploy" (oben rechts)

## 🔧 Vercel-spezifische Anpassungen

### Serverless Functions

Vercel verwendet Serverless Functions. Erstellen Sie:

```bash
# Erstellen Sie api-Verzeichnis
mkdir -p api
```

Erstellen Sie `api/index.js`:

```javascript
const app = require('../server/index');

module.exports = app;
```

### Static File Serving

Für CMR-PDFs müssen Sie einen Cloud-Storage verwenden (z.B. AWS S3, Cloudinary):

**Alternative**: Verwenden Sie Vercel Blob Storage:

```bash
npm install @vercel/blob
```

## 📝 Nach dem Deployment

### 1. Testen Sie die Anwendung

1. Öffnen Sie Ihre Vercel-URL
2. Registrieren Sie einen Test-Benutzer
3. Erstellen Sie einen Test-Auftrag
4. Prüfen Sie Email-Benachrichtigungen
5. Testen Sie CMR-Erstellung
6. Testen Sie mobile Unterschrift

### 2. Custom Domain verbinden (Optional)

1. Gehen Sie zu Vercel → Ihr Projekt → "Settings" → "Domains"
2. Fügen Sie Ihre Domain hinzu (z.B. `zipmend.com`)
3. Folgen Sie den DNS-Anweisungen
4. Aktualisieren Sie `CLIENT_URL` in den Environment Variables

### 3. SSL/HTTPS

- Vercel aktiviert automatisch HTTPS
- Ihr SSL-Zertifikat wird automatisch erneuert

## 🔄 Continuous Deployment

Vercel ist jetzt mit GitHub verbunden:

- **Automatisches Deployment**: Jeder Push zu `main` triggert ein Deployment
- **Preview Deployments**: Jeder Pull Request bekommt eine Preview-URL
- **Rollbacks**: Einfaches Zurückrollen zu vorherigen Versionen

### Workflow:

```bash
# Änderungen machen
git add .
git commit -m "Feature: XYZ hinzugefügt"
git push

# Vercel deployed automatisch!
```

## 🐛 Troubleshooting

### Deployment schlägt fehl

**Problem**: Build-Fehler
**Lösung**: 
```bash
# Lokal testen
cd client
npm run build

# Fehler beheben und erneut pushen
```

### Datenbank-Verbindung schlägt fehl

**Problem**: Cannot connect to database
**Lösung**:
- Prüfen Sie DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
- Stellen Sie sicher, dass die Datenbank öffentlich erreichbar ist
- Prüfen Sie Firewall-Regeln

### Email-Versand funktioniert nicht

**Problem**: Emails werden nicht gesendet
**Lösung**:
- Prüfen Sie EMAIL_USER und EMAIL_PASSWORD
- Bei Gmail: Verwenden Sie App-Passwort, nicht normales Passwort
- Prüfen Sie SMTP-Port (587 für TLS, 465 für SSL)

### CMR-PDFs werden nicht gespeichert

**Problem**: PDFs verschwinden nach Neustart
**Lösung**:
- Vercel Serverless Functions sind stateless
- Verwenden Sie Cloud Storage (S3, Cloudinary, Vercel Blob)
- Oder: Speichern Sie PDFs in der Datenbank als Base64

## 📊 Monitoring

### Vercel Analytics

1. Gehen Sie zu Ihrem Projekt in Vercel
2. Klicken Sie auf "Analytics"
3. Sehen Sie Besucher, Performance, etc.

### Logs anzeigen

1. Gehen Sie zu Ihrem Projekt in Vercel
2. Klicken Sie auf "Deployments"
3. Wählen Sie ein Deployment
4. Klicken Sie auf "View Function Logs"

## 💰 Kosten

### Vercel (Hobby Plan - Kostenlos)
- ✅ Unbegrenzte Deployments
- ✅ 100 GB Bandwidth
- ✅ Serverless Functions
- ✅ Automatisches HTTPS
- ✅ Custom Domains

### Supabase (Free Tier)
- ✅ 500 MB Datenbank
- ✅ 2 GB Bandwidth
- ✅ Automatische Backups

### SendGrid (Free Tier)
- ✅ 100 Emails/Tag

**Total: €0/Monat** für kleine bis mittlere Nutzung

## 🔐 Sicherheit

### Wichtige Punkte:

1. **Niemals** Secrets in Git committen
2. Verwenden Sie starke Passwörter
3. Aktivieren Sie 2FA auf GitHub und Vercel
4. Rotieren Sie Secrets regelmäßig
5. Verwenden Sie Environment Variables für alle Secrets

### .env.example aktualisieren

Die `.env.example` Datei ist bereits vorhanden und zeigt die benötigten Variablen.

## 📚 Weitere Ressourcen

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Docs**: https://docs.github.com

## ✅ Checkliste

- [ ] GitHub Repository erstellt
- [ ] Code zu GitHub gepusht
- [ ] Produktions-Datenbank eingerichtet (Supabase/Railway)
- [ ] SQL-Schemas in Produktions-DB importiert
- [ ] Email-Service konfiguriert (Gmail/SendGrid)
- [ ] Vercel Account erstellt
- [ ] Projekt in Vercel importiert
- [ ] Environment Variables in Vercel gesetzt
- [ ] Erstes Deployment erfolgreich
- [ ] CLIENT_URL aktualisiert
- [ ] Anwendung getestet
- [ ] Custom Domain verbunden (optional)

## 🎉 Fertig!

Ihre Anwendung ist jetzt live unter:
```
https://your-app.vercel.app
```

Bei Fragen oder Problemen, konsultieren Sie die Vercel-Dokumentation oder die Logs.

**Viel Erfolg mit Ihrer Live-Anwendung!** 🚀
