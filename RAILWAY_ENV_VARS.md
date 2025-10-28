# Railway Environment Variables

## Email-Konfiguration

Gehen Sie zu Railway → Ihr Projekt → Variables und setzen Sie:

```
EMAIL_HOST=mail.florianbrach.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@florianbrach.com
EMAIL_PASS=[IHR_EMAIL_PASSWORT]
EMAIL_FROM=info@florianbrach.com
```

## Wichtig:
- `EMAIL_PASS` muss das Passwort Ihres Email-Accounts sein
- `EMAIL_SECURE=true` für Port 465 (SSL)
- Nach dem Setzen der Variables wird Railway automatisch neu deployen

## Testen:
Nach dem Deployment können Sie testen ob Emails versendet werden:
1. Bewerbung auf einen Auftrag → Admin erhält Email
2. Admin akzeptiert Bewerbung → Auftragnehmer erhält Email
3. Status "Abgeholt" → Kunde erhält Email
4. Status "Zugestellt" → Kunde erhält Email
