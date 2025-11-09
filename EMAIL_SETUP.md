# 📧 Email-Konfiguration für Courierly

## IONOS/One.com Email-Einstellungen

### Zugangsdaten
- **Email:** info@courierly.de
- **Passwort:** sonteg-biFfo2-wyhros

### Server-Einstellungen

#### SMTP (Ausgehend)
- **Server:** send.one.com
- **Port:** 465
- **Verschlüsselung:** SSL/TLS
- **Authentifizierung:** Ja

#### IMAP (Eingehend)
- **Server:** imap.one.com
- **Port:** 993
- **Verschlüsselung:** SSL/TLS

#### POP3 (Alternative)
- **Server:** pop.one.com
- **Port:** 995
- **Verschlüsselung:** SSL/TLS

---

## Backend-Konfiguration

### Lokale Entwicklung (.env)

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```env
# Email Configuration (IONOS/One.com)
EMAIL_HOST=send.one.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=sonteg-biFfo2-wyhros
EMAIL_FROM=info@courierly.de
```

### Railway Production

Gehen Sie zu Railway → Ihr Projekt → Variables und setzen Sie:

```
EMAIL_HOST=send.one.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=sonteg-biFfo2-wyhros
EMAIL_FROM=info@courierly.de
```

**Wichtig:** Nach dem Setzen der Variables wird Railway automatisch neu deployen.

---

## Email-Service im Code

### Nodemailer-Konfiguration

Der Email-Service verwendet Nodemailer mit folgender Konfiguration:

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true für Port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### Email-Templates

Die Plattform versendet automatisch Emails bei:

1. **Neue Bewerbung** → Admin erhält Benachrichtigung
2. **Bewerbung akzeptiert** → Auftragnehmer erhält Bestätigung
3. **Paket abgeholt** → Kunde erhält Status-Update
4. **Paket zugestellt** → Kunde erhält Bestätigung + CMR-PDF

---

## Testen der Email-Funktion

### 1. Lokaler Test

```bash
# Backend starten
npm run server

# Test-Email senden (optional Test-Script erstellen)
node test-email.js
```

### 2. Production Test

Nach dem Railway-Deployment:

1. Bewerbung auf einen Auftrag → Admin erhält Email
2. Admin akzeptiert Bewerbung → Auftragnehmer erhält Email
3. Status "Abgeholt" → Kunde erhält Email
4. Status "Zugestellt" → Kunde erhält Email + CMR-PDF

---

## Troubleshooting

### Email wird nicht versendet

**Prüfen Sie:**

1. **Umgebungsvariablen gesetzt?**
   ```bash
   echo $EMAIL_HOST
   echo $EMAIL_USER
   ```

2. **Firewall/Port blockiert?**
   - Port 465 muss offen sein
   - SSL/TLS muss unterstützt werden

3. **Credentials korrekt?**
   - Email: info@courierly.de
   - Passwort: sonteg-biFfo2-wyhros

4. **IONOS-Account aktiv?**
   - Login auf webmail.one.com testen
   - SMTP-Zugriff aktiviert?

### Logs prüfen

```bash
# Railway Logs
railway logs

# Lokale Logs
npm run server
```

---

## Webmail-Zugang

**URL:** https://webmail.one.com

**Login:**
- Email: info@courierly.de
- Passwort: sonteg-biFfo2-wyhros

Hier können Sie:
- Gesendete Emails prüfen
- Posteingang checken
- Email-Einstellungen verwalten

---

## Sicherheitshinweise

⚠️ **Wichtig:**
- `.env` Datei ist in `.gitignore` und wird NICHT committed
- Passwörter niemals im Code hardcoden
- Nur über Umgebungsvariablen arbeiten
- Railway Variables sind verschlüsselt gespeichert

---

## Email-Adressen in der Plattform

Alle Referenzen wurden aktualisiert:

✅ Footer: info@courierly.de  
✅ AGB: info@courierly.de  
✅ Widerrufsbelehrung: info@courierly.de  
✅ Kontaktformulare: info@courierly.de  
✅ Email-Absender: info@courierly.de  

---

**Status:** ✅ Email-System konfiguriert und einsatzbereit
**Datum:** 09. November 2025
