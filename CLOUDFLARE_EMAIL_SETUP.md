# 📧 Cloudflare Email Routing - Setup Guide

## ✅ Voraussetzungen

- ✅ Cloudflare Account erstellt
- ✅ Domain courierly.de zu Cloudflare hinzugefügt
- ✅ Nameserver geändert (chris.ns.cloudflare.com, millie.ns.cloudflare.com)
- ✅ Domain ist aktiv

---

## 🚀 Schritt 1: Email Routing aktivieren

1. **Öffnen Sie:** https://dash.cloudflare.com
2. **Wählen Sie:** courierly.de
3. **Linke Sidebar:** Klicken Sie auf **"Email"**
4. **Klicken Sie:** **"Email Routing"**
5. **Klicken Sie:** **"Get started"** oder **"Enable Email Routing"**

---

## 📬 Schritt 2: Destination Email hinzufügen

1. **Email-Adresse eingeben:** `info@courierly.de`
   - Das ist Ihre IONOS-Email, wo die Emails ankommen sollen

2. **Klicken Sie:** **"Send verification email"**

3. **Prüfen Sie Ihr IONOS Postfach:**
   - Login: https://webmail.one.com
   - Email: info@courierly.de
   - Passwort: sonteg-biFfo2-wyhros

4. **Öffnen Sie die Cloudflare-Email** und klicken Sie auf den Bestätigungslink

5. **Zurück zu Cloudflare:** Die Email sollte jetzt als "Verified" angezeigt werden ✅

---

## ⚙️ Schritt 3: Email Workers für SMTP erstellen

### Option A: Über Dashboard (Empfohlen)

1. **In Cloudflare Email Routing:**
   - Klicken Sie auf **"Email Workers"** Tab
   - Falls nicht sichtbar: **"Settings"** → **"Email Workers"**

2. **Klicken Sie:** **"Create"** oder **"Create Email Worker"**

3. **Name eingeben:** `Courierly Backend`

4. **Worker erstellen:**
   - Cloudflare erstellt automatisch einen Worker
   - Sie erhalten SMTP-Credentials

5. **SMTP-Credentials kopieren:**
   ```
   SMTP Server: smtp.cloudflare.com (oder ähnlich)
   SMTP Port: 587
   Username: [wird angezeigt]
   Password: [wird angezeigt]
   ```

### Option B: Über API (Falls Email Workers nicht verfügbar)

Falls Email Workers nicht im Dashboard verfügbar sind, verwenden wir eine alternative Methode:

1. **Gehen Sie zu:** Email Routing → **"Routes"**
2. **Erstellen Sie eine Catch-All Route:**
   - Pattern: `*@courierly.de`
   - Action: Forward to `info@courierly.de`
3. **Für SMTP-Sending:** Verwenden wir weiterhin IONOS direkt

---

## 🔧 Schritt 4: Railway Variables setzen

### Wenn Cloudflare Email Workers verfügbar:

```
EMAIL_HOST=smtp.cloudflare.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<Cloudflare SMTP Username>
EMAIL_PASSWORD=<Cloudflare SMTP Password>
EMAIL_FROM=noreply@courierly.de
```

### Alternative: IONOS mit Port 587 (Wenn Cloudflare nicht funktioniert)

```
EMAIL_HOST=send.one.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=sonteg-biFfo2-wyhros
EMAIL_FROM=info@courierly.de
```

---

## 🧪 Schritt 5: Testen

### Test 1: Email Routing (Empfang)

1. **Senden Sie eine Test-Email an:** noreply@courierly.de
2. **Prüfen Sie:** info@courierly.de Postfach
3. **Sollte ankommen:** ✅

### Test 2: SMTP Sending (Versand)

1. **Railway Logs öffnen:**
   ```bash
   railway logs
   ```

2. **Suchen Sie nach:**
   ```
   ✅ Email service configured
   📧 Using SMTP: smtp.cloudflare.com:587
   ```

3. **Test-Email senden:**
   - Erstellen Sie einen Test-Auftrag
   - Bewerben Sie sich darauf
   - Prüfen Sie Railway Logs für "Email sent"

---

## 🔍 Troubleshooting

### Problem: Email Workers nicht verfügbar

**Lösung:** Verwenden Sie IONOS direkt mit Port 587

```
EMAIL_HOST=send.one.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Problem: "Connection timeout"

**Lösung 1:** Prüfen Sie Port
- Port 587 statt 465 verwenden
- EMAIL_SECURE=false setzen

**Lösung 2:** Firewall
- Railway blockiert möglicherweise ausgehende SMTP
- Verwenden Sie einen SMTP-Relay-Service

### Problem: "Authentication failed"

**Lösung:**
- Credentials nochmal prüfen
- Bei Cloudflare: Neuen Worker erstellen
- Bei IONOS: Passwort korrekt?

---

## 📊 Vergleich: Cloudflare vs IONOS

### Cloudflare Email Workers
- ✅ Unbegrenzte Emails
- ✅ Kostenlos
- ✅ Professionell
- ❌ Möglicherweise nicht verfügbar (je nach Plan)
- ❌ Setup komplexer

### IONOS Direct (Port 587)
- ✅ Einfaches Setup
- ✅ Funktioniert garantiert
- ✅ Bereits konfiguriert
- ⚠️ Möglicherweise Limits
- ⚠️ Weniger professionell

---

## 🎯 Empfehlung

### Schritt 1: Versuchen Sie Cloudflare
1. Email Routing aktivieren
2. Destination Email verifizieren
3. Prüfen Sie ob Email Workers verfügbar sind

### Schritt 2: Falls Cloudflare nicht funktioniert
Verwenden Sie IONOS mit Port 587:

**Railway Variables:**
```
EMAIL_HOST=send.one.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=sonteg-biFfo2-wyhros
EMAIL_FROM=info@courierly.de
```

### Schritt 3: Testen
- Logs prüfen
- Test-Email senden
- Verifizieren

---

## 📝 Nächste Schritte

1. [ ] Email Routing in Cloudflare aktivieren
2. [ ] Destination Email verifizieren
3. [ ] Email Workers erstellen (falls verfügbar)
4. [ ] SMTP-Credentials kopieren
5. [ ] Railway Variables setzen
6. [ ] Testen

---

**Bereit für Email-Integration!** 📧

**Wo sind Sie gerade im Setup-Prozess?**
- Cloudflare Dashboard geöffnet?
- Email Routing aktiviert?
- Brauchen Sie Hilfe bei einem bestimmten Schritt?
