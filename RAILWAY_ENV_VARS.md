# Railway Environment Variables

## Email-Konfiguration

Gehen Sie zu Railway → Ihr Projekt → Variables und setzen Sie:

```
EMAIL_HOST=send.one.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@courierly.de
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=info@courierly.de
```

## Wichtig:
- `EMAIL_PASSWORD` muss das Passwort Ihres Email-Accounts sein
- `EMAIL_SECURE=true` für Port 465 (SSL)
- Nach dem Setzen der Variables wird Railway automatisch neu deployen

## Testen:
Nach dem Deployment können Sie testen ob Emails versendet werden:
1. Bewerbung auf einen Auftrag → Admin erhält Email
2. Admin akzeptiert Bewerbung → Auftragnehmer erhält Email
3. Status "Abgeholt" → Kunde erhält Email
4. Status "Zugestellt" → Kunde erhält Email
