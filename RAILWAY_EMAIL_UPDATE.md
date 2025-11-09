# 🚀 Railway Email-Variablen Update

## ⚠️ Aktuelle Situation

Die Railway-Variablen verwenden noch:
- ❌ `EMAIL_PASS` (falsch - sollte `EMAIL_PASSWORD` sein)
- ❌ `EMAIL_HOST=mail.florianbrach.com` (alt)
- ❌ `EMAIL_USER=info@florianbrach.com` (alt)
- ❌ `EMAIL_FROM=info@florianbrach.com` (alt)

## ✅ Neue Konfiguration

### Schritt 1: Alte Variable löschen

**Löschen Sie:**
- `EMAIL_PASS` ❌

### Schritt 2: Neue/Aktualisierte Variablen setzen

**In Railway → Variables:**

```
EMAIL_HOST=send.one.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=sonteg-biFfo2-wyhros
EMAIL_FROM=info@courierly.de
```

### Schritt 3: Wichtige Hinweise

1. **Variable umbenennen:**
   - `EMAIL_PASS` → `EMAIL_PASSWORD` ✅
   - Der Backend-Code erwartet `EMAIL_PASSWORD`

2. **Port 465 = SSL:**
   - `EMAIL_SECURE=true` ist wichtig für Port 465
   - Ohne diese Variable funktioniert SSL nicht

3. **IONOS/One.com Settings:**
   - SMTP: `send.one.com`
   - Port: `465` (SSL/TLS)
   - Authentifizierung erforderlich

---

## 📋 Komplette Variable-Liste

Kopieren Sie diese Werte in Railway:

| Variable | Wert |
|----------|------|
| `EMAIL_HOST` | `send.one.com` |
| `EMAIL_PORT` | `465` |
| `EMAIL_SECURE` | `true` |
| `EMAIL_USER` | `info@courierly.de` |
| `EMAIL_PASSWORD` | `sonteg-biFfo2-wyhros` |
| `EMAIL_FROM` | `info@courierly.de` |

---

## 🔧 So aktualisieren Sie Railway-Variablen

### Option 1: Über Railway Dashboard (Empfohlen)

1. **Railway Dashboard öffnen**
   - https://railway.app
   - Ihr Projekt auswählen

2. **Variables Tab**
   - Auf "Variables" klicken
   - Alte Variable `EMAIL_PASS` löschen (❌ Button)

3. **Neue Variablen hinzufügen**
   - "New Variable" klicken
   - Name: `EMAIL_PASSWORD`
   - Value: `sonteg-biFfo2-wyhros`
   - "Add" klicken

4. **Bestehende aktualisieren**
   - `EMAIL_HOST` → `send.one.com`
   - `EMAIL_USER` → `info@courierly.de`
   - `EMAIL_FROM` → `info@courierly.de`

5. **Neue hinzufügen (falls nicht vorhanden)**
   - `EMAIL_SECURE` → `true`

6. **Speichern**
   - Railway deployt automatisch neu

### Option 2: Über Railway CLI

```bash
# Railway CLI installieren (falls noch nicht vorhanden)
npm install -g @railway/cli

# Login
railway login

# Projekt verlinken
railway link

# Variablen setzen
railway variables set EMAIL_HOST=send.one.com
railway variables set EMAIL_PORT=465
railway variables set EMAIL_SECURE=true
railway variables set EMAIL_USER=info@courierly.de
railway variables set EMAIL_PASSWORD=sonteg-biFfo2-wyhros
railway variables set EMAIL_FROM=info@courierly.de

# Alte Variable löschen
railway variables delete EMAIL_PASS
```

---

## ✅ Verifikation

### 1. Logs prüfen

Nach dem Deployment:

```bash
railway logs
```

**Erwartete Ausgabe:**
```
✅ Email service configured
```

**Fehler-Ausgaben:**
```
⚠️ Email service not configured - emails will be logged only
```
→ Variablen fehlen oder sind falsch

### 2. Test-Email senden

**Im Backend-Code (temporär für Test):**

```javascript
// In server/index.js oder einer Route
const { sendNewOrderNotification } = require('./utils/emailService');

// Test-Email
sendNewOrderNotification('ihre-test@email.de', {
  pickup_postal_code: '10115',
  pickup_city: 'Berlin',
  delivery_postal_code: '80335',
  delivery_city: 'München',
  pickup_date: new Date(),
  vehicle_type: 'Kleintransporter',
  price: 250
});
```

### 3. Webmail prüfen

**Login:** https://webmail.one.com
- Email: info@courierly.de
- Passwort: sonteg-biFfo2-wyhros

**Prüfen Sie:**
- "Gesendete Objekte" für versendete Emails
- Keine Fehler-Bounces

---

## 🐛 Troubleshooting

### Problem: "Email service not configured"

**Lösung:**
- Alle 6 Variablen gesetzt?
- Schreibweise korrekt? (`EMAIL_PASSWORD` nicht `EMAIL_PASS`)
- Railway neu deployt?

### Problem: "Authentication failed"

**Lösung:**
- Passwort korrekt? `sonteg-biFfo2-wyhros`
- Email korrekt? `info@courierly.de`
- IONOS-Account aktiv?

### Problem: "Connection timeout"

**Lösung:**
- Port 465 verwendet?
- `EMAIL_SECURE=true` gesetzt?
- Railway Firewall blockiert Port 465? (unwahrscheinlich)

### Problem: Emails werden nicht empfangen

**Lösung:**
- Spam-Ordner prüfen
- Webmail-Login testen
- SMTP-Logs in Railway prüfen

---

## 📊 Backend-Code-Referenz

Der Code erwartet diese Variablen:

```javascript
// server/utils/emailService.js
if (process.env.EMAIL_HOST && 
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASSWORD) {  // ← Nicht EMAIL_PASS!
  
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // SSL für Port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,  // ← Hier!
    },
  });
}
```

---

## ✨ Nach erfolgreichem Update

**Emails werden automatisch versendet bei:**

1. ✅ Neue Bewerbung → Admin erhält Benachrichtigung
2. ✅ Bewerbung akzeptiert → Auftragnehmer erhält Bestätigung
3. ✅ Paket abgeholt → Kunde erhält Status-Update
4. ✅ Paket zugestellt → Kunde erhält Bestätigung + CMR-PDF

---

**Status:** ⏳ Warten auf Railway-Update  
**Nächster Schritt:** Variablen in Railway setzen  
**Datum:** 09. November 2025
