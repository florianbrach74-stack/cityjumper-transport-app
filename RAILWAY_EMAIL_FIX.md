# 🔧 Railway Email Connection Timeout Fix

## Problem
Railway zeigt: `Email configuration error (emails disabled): Connection timeout`

Lokal funktioniert der Email-Versand einwandfrei ✅

## Ursache
Railway's Netzwerk hat möglicherweise Probleme mit Port 465 (SSL/TLS).

## Lösung: Port 587 verwenden (STARTTLS)

### In Railway Variables ändern:

**Aktuell:**
```
EMAIL_PORT=465
EMAIL_SECURE=true
```

**Neu (empfohlen):**
```
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Warum Port 587?

- **Port 465:** SSL/TLS (direkte Verschlüsselung)
- **Port 587:** STARTTLS (Verschlüsselung nach Verbindungsaufbau)

Port 587 ist oft zuverlässiger in Cloud-Umgebungen wie Railway.

---

## Alternative: SMTP-Relay verwenden

Falls Port 587 auch nicht funktioniert, können wir einen SMTP-Relay-Service verwenden:

### Option 1: SendGrid (kostenlos bis 100 Emails/Tag)
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=<SendGrid API Key>
```

### Option 2: Mailgun (kostenlos bis 5000 Emails/Monat)
```
EMAIL_HOST=smtp.eu.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@<your-domain>
EMAIL_PASSWORD=<Mailgun SMTP Password>
```

### Option 3: Amazon SES (sehr günstig)
```
EMAIL_HOST=email-smtp.eu-central-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<AWS Access Key>
EMAIL_PASSWORD=<AWS Secret Key>
```

---

## Empfehlung

**Schritt 1:** Versuchen Sie Port 587 mit IONOS
```
EMAIL_HOST=send.one.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=sonteg-biFfo2-wyhros
EMAIL_FROM=info@courierly.de
```

**Schritt 2:** Falls das nicht funktioniert, verwenden Sie SendGrid
- Kostenlos
- Sehr zuverlässig
- Einfach einzurichten
- 100 Emails/Tag reichen für den Anfang

---

## Status

✅ Lokal: Email-Versand funktioniert perfekt  
⏳ Railway: Testen mit Port 587  
🔄 Backup: SendGrid bereit falls nötig
