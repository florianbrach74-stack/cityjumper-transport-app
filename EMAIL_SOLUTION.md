# 📧 Email-Lösung: Railway SMTP Problem

## ❌ Problem

Railway blockiert ausgehende SMTP-Verbindungen (Port 25, 465, 587).

**Fehler:**
```
Connection timeout (ETIMEDOUT)
```

---

## ✅ Lösung: Resend.com (Empfohlen)

### Vorteile:
- ✅ **Kostenlos:** 3,000 Emails/Monat, 100 Emails/Tag
- ✅ **Einfach:** API-basiert, kein SMTP
- ✅ **Funktioniert auf Railway:** Keine Port-Blockierung
- ✅ **Professionell:** Deliverability-Tracking
- ✅ **Schnell:** Setup in 5 Minuten

---

## 🚀 Setup-Anleitung

### Schritt 1: Resend Account erstellen

1. Gehen Sie zu: https://resend.com/signup
2. Registrieren Sie sich (kostenlos)
3. Bestätigen Sie Ihre Email

### Schritt 2: Domain verifizieren

1. **Resend Dashboard:** https://resend.com/domains
2. **Klicken Sie:** "Add Domain"
3. **Domain eingeben:** `courierly.de`
4. **DNS-Records kopieren** (werden angezeigt)

### Schritt 3: DNS-Records in Cloudflare hinzufügen

Resend zeigt Ihnen 3 DNS-Records:

**In Cloudflare:**
1. Gehen Sie zu: DNS → Records
2. Fügen Sie die Resend-Records hinzu:
   - TXT Record für Domain-Verification
   - CNAME für DKIM
   - Eventuell weitere

### Schritt 4: API Key erstellen

1. **Resend Dashboard:** https://resend.com/api-keys
2. **Klicken Sie:** "Create API Key"
3. **Name:** "Courierly Backend"
4. **Permission:** "Sending access"
5. **Kopieren Sie den API Key** (beginnt mit `re_...`)

### Schritt 5: Code anpassen

**Installation:**
```bash
npm install resend
```

**Neue Datei:** `server/utils/emailServiceResend.js`

```javascript
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'Courierly <noreply@courierly.de>',
      to: [to],
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend email error:', error);
    throw error;
  }
};

module.exports = { sendEmail };
```

**Ersetzen in allen Email-Funktionen:**

```javascript
// ALT (Nodemailer):
const transporter = nodemailer.createTransport({...});
await transporter.sendMail({...});

// NEU (Resend):
const { sendEmail } = require('../utils/emailServiceResend');
await sendEmail({
  to: 'customer@example.com',
  subject: 'Ihr Auftrag wurde angenommen',
  html: '<h1>Hallo!</h1>'
});
```

### Schritt 6: Railway Variables setzen

```bash
railway variables --set RESEND_API_KEY=re_your_api_key_here
```

### Schritt 7: Testen

```bash
railway up
railway logs
```

---

## 🔄 Alternative: SendGrid

Falls Resend nicht funktioniert:

### Vorteile:
- ✅ Kostenlos: 100 Emails/Tag
- ✅ Etabliert und zuverlässig

### Setup:
1. https://signup.sendgrid.com
2. API Key erstellen
3. `npm install @sendgrid/mail`
4. Ähnliche Integration wie Resend

---

## 📊 Vergleich

| Service | Free Tier | Setup | Railway |
|---------|-----------|-------|---------|
| **Resend** | 3000/Monat | ⭐⭐⭐⭐⭐ | ✅ |
| **SendGrid** | 100/Tag | ⭐⭐⭐⭐ | ✅ |
| **IONOS SMTP** | Unbegrenzt | ⭐⭐ | ❌ Blockiert |
| **Cloudflare** | Nur Routing | ⭐⭐⭐ | ❌ Kein Versand |

---

## 🎯 Empfehlung

**Verwenden Sie Resend:**
1. Kostenlos und großzügig (3000 Emails/Monat)
2. Einfaches Setup
3. Funktioniert garantiert auf Railway
4. Professionelle Deliverability

---

## 📝 Nächste Schritte

1. [ ] Resend Account erstellen
2. [ ] Domain verifizieren
3. [ ] API Key erstellen
4. [ ] Code anpassen (ich helfe dabei!)
5. [ ] Railway Variables setzen
6. [ ] Testen

---

**Soll ich Ihnen beim Resend-Setup helfen?** 📧
