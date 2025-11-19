# 🔧 Migrations für Order Monitoring System

## Nach dem Railway Deployment ausführen:

### 1. Monitoring-Spalten hinzufügen
```bash
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/add-order-monitoring-columns
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "message": "Order monitoring columns added successfully",
  "columns": [
    { "column_name": "pickup_window_start_notified", ... },
    { "column_name": "pickup_window_start_notification_sent_at", ... },
    { "column_name": "expired_and_archived", ... },
    { "column_name": "expiration_notification_sent_at", ... },
    { "column_name": "archived_at", ... },
    { "column_name": "archive_reason", ... }
  ]
}
```

---

### 2. Preis-Historie Tabelle erstellen
```bash
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/create-price-history-table
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "message": "Price history table created successfully",
  "columns": [
    { "column_name": "id", ... },
    { "column_name": "order_id", ... },
    { "column_name": "old_price", ... },
    { "column_name": "new_price", ... },
    { "column_name": "changed_by_user_id", ... },
    { "column_name": "reason", ... },
    { "column_name": "created_at", ... }
  ]
}
```

---

## ✅ Verifizierung

Nach erfolgreicher Migration sollten Sie in den Railway-Logs sehen:

```
✅ Order Monitoring Service started
🔍 [Order Monitoring] Starting check for unassigned orders...
```

Der Cron-Job läuft automatisch alle 5 Minuten!

---

## 🧪 Test-Szenario

**Um das System zu testen:**

1. **Auftrag erstellen** mit Abholzeitfenster in naher Zukunft
   - z.B. Heute 14:00, Abholung Heute 14:05-14:10

2. **Warten bis 14:05** (Zeitfenster-Start)
   - System sendet Email: "Noch nicht vermittelt"
   - Kunde erhält Link zur Preis-Anpassung

3. **Preis anpassen** (optional)
   - Kunde klickt Link in Email
   - Erhöht Preis um 10-20%
   - System speichert neuen Preis

4. **Warten bis 14:11** (Zeitfenster-Ende + 1h)
   - System sendet Email: "Auftrag abgelaufen"
   - Status wird auf 'expired' gesetzt
   - Auftrag wird archiviert

---

## 📧 Email-Vorschau

### Email 1: Zeitfenster-Start
**Betreff:** ⏰ Ihr Auftrag #27 - Noch nicht vermittelt

**Inhalt:**
- Auftragsdetails
- Aktueller Preis
- Button: "Preis jetzt anpassen"
- Hinweis: Ablauf in X Stunden

### Email 2: Ablauf
**Betreff:** ❌ Ihr Auftrag #27 konnte nicht vermittelt werden

**Inhalt:**
- Entschuldigung
- Auftragsdetails
- Tipps für künftige Aufträge
- Button: "Neuen Auftrag erstellen"

---

## 🔍 Monitoring

**Prüfen Sie die Logs:**
```bash
# Railway Dashboard → Deployments → View Logs
```

**Suchen Sie nach:**
- `[Order Monitoring] Starting check`
- `[Zeitfenster-Start] Found X orders to notify`
- `[Ablauf] Found X expired orders to archive`
- `✅ Notification sent for order #X`
- `✅ Order #X archived`

---

## ⚙️ Konfiguration

**Cron-Intervall ändern:**
```javascript
// server/services/orderMonitoringService.js
// Zeile 258: setInterval(() => { ... }, 5 * 60 * 1000);

// Ändern auf z.B. 1 Minute für Testing:
setInterval(() => { ... }, 1 * 60 * 1000);
```

**Email-Absender ändern:**
```javascript
// server/utils/emailService.js
// EMAIL_FROM in .env setzen
```

---

## 🐛 Troubleshooting

**Problem: Keine Emails werden gesendet**
- Prüfen Sie EMAIL_* Variablen in Railway
- Prüfen Sie Logs für Email-Fehler
- System funktioniert auch ohne Email (nur Logs)

**Problem: Cron-Job läuft nicht**
- Prüfen Sie Server-Logs beim Start
- Sollte sehen: "✅ Order Monitoring Service started"
- Restart Railway Service

**Problem: Migration fehlgeschlagen**
- Prüfen Sie Datenbank-Verbindung
- Führen Sie Migrations manuell aus (psql)
- Prüfen Sie ob Spalten bereits existieren

---

## 📝 Nächste Schritte

1. ✅ Migrations ausführen (siehe oben)
2. ✅ Logs prüfen (Cron-Job gestartet?)
3. ✅ Test-Auftrag erstellen
4. ✅ Emails prüfen
5. ✅ Preis-Anpassung testen
6. ✅ Archivierung prüfen

---

**Alles bereit! System läuft automatisch nach Deployment.** 🚀
