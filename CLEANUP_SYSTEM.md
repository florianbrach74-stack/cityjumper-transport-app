# 🧹 Automatisches Cleanup-System

## Übersicht

Das System löscht automatisch alte Aufträge nach **3 Monaten** nach Abschluss, um die Datenbank schlank zu halten.

---

## 🎯 Was wird gelöscht?

### Aufträge MIT Rechnung:
- ✅ **Rechnung bleibt erhalten** (invoice_number, Preise, etc.)
- 🗑️ CMR-Dokumente (Unterschrift, PDF)
- 🗑️ Sensible Adressdaten (genaue Adressen, Kontaktdaten)
- 🗑️ Beschreibung und Anforderungen
- 🗑️ Notizen (Wartezeit, Retouren, Stornierung)
- ✅ **Städte bleiben** (für Statistiken)
- ✅ **Preise bleiben** (für Buchhaltung)

### Aufträge OHNE Rechnung:
- 🗑️ **Komplett gelöscht** (kein Grund zum Behalten)

---

## ⏰ Zeitplan

### Automatisch:
- **Täglich um 3:00 Uhr morgens**
- Löscht Aufträge die vor >3 Monaten abgeschlossen wurden

### Manuell (Admin):
- API-Endpunkt: `POST /api/cleanup/run-cleanup`
- Kann jederzeit vom Admin ausgeführt werden

---

## 📊 Was bleibt erhalten?

### Für Buchhaltung:
- ✅ Rechnungsnummer
- ✅ Kundenpreis
- ✅ Auftragnehmerpreis
- ✅ Alle Gebühren (Wartezeit, Retouren, Stornierung)
- ✅ Zahlungsstatus
- ✅ Datum (Abschluss, Abholung, Zustellung)

### Für Statistiken:
- ✅ Städte (Abholung & Zustellung)
- ✅ Status
- ✅ Fahrzeugtyp
- ✅ Entfernung
- ✅ Dauer

### Was gelöscht wird:
- 🗑️ Genaue Adressen
- 🗑️ Kontaktnamen und Telefonnummern
- 🗑️ CMR-Unterschriften und PDFs
- 🗑️ Beschreibung des Transportguts
- 🗑️ Spezielle Anforderungen
- 🗑️ Notizen und Begründungen

---

## 🔧 Technische Details

### Datenbank-Spalten:
```sql
cleaned_up BOOLEAN DEFAULT false
cleaned_up_at TIMESTAMP
```

### Service:
- **Datei**: `server/services/orderCleanupService.js`
- **Cronjob**: Läuft täglich um 3:00 Uhr
- **Logik**: 
  1. Finde Aufträge älter als 3 Monate
  2. Prüfe ob Rechnung existiert
  3. Wenn JA: Lösche nur CMR/sensible Daten
  4. Wenn NEIN: Lösche Auftrag komplett

### API-Endpunkte:

#### Manuelle Bereinigung starten:
```bash
POST /api/cleanup/run-cleanup
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Bereinigung erfolgreich durchgeführt",
  "result": {
    "deleted": 5,      // Komplett gelöscht
    "kept": 12,        // Rechnung behalten
    "cmrDeleted": 12   // CMR-Dokumente gelöscht
  }
}
```

#### Status abrufen:
```bash
GET /api/cleanup/cleanup-status
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "cleanedUp": 15,           // Bereits bereinigte Aufträge
  "canBeCleanedUp": 3,       // Können bereinigt werden
  "thresholdDate": "2024-08-26"  // Schwellwert-Datum
}
```

---

## 🧪 Testen

### Test-Script:
```bash
node run-cleanup-migration.js  # Migration ausführen
```

### Manueller Test (als Admin):
```javascript
// Im Browser oder Postman
fetch('https://your-api.railway.app/api/cleanup/run-cleanup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  }
})
.then(r => r.json())
.then(console.log);
```

---

## 📋 Beispiel-Log

```
🧹 [Order Cleanup] Starte Bereinigung alter Aufträge...
📅 Lösche Aufträge abgeschlossen vor: 2024-08-26
📦 Gefunden: 15 Aufträge zum Löschen

  📄 Auftrag #123 hat Rechnung INV-2024-123 - wird behalten
    ✅ CMR und sensible Daten gelöscht, Rechnung behalten
  
  🗑️  Auftrag #124 hat keine Rechnung - wird komplett gelöscht
    ✅ Auftrag komplett gelöscht

📊 Cleanup-Zusammenfassung:
  🗑️  Komplett gelöscht: 5 Aufträge
  📄 Rechnung behalten: 10 Aufträge
  🧹 CMR gelöscht: 10 Dokumente
✅ [Order Cleanup] Bereinigung abgeschlossen
```

---

## ⚠️ Wichtige Hinweise

### DSGVO-Konformität:
- ✅ Sensible Daten werden nach 3 Monaten gelöscht
- ✅ Nur notwendige Daten für Buchhaltung bleiben
- ✅ Automatische Bereinigung ohne manuelle Intervention

### Buchhaltung:
- ✅ Alle Rechnungsdaten bleiben erhalten
- ✅ 10 Jahre Aufbewahrungspflicht wird erfüllt
- ✅ Steuerprüfung möglich

### Performance:
- ✅ Datenbank bleibt schlank
- ✅ Schnellere Queries
- ✅ Weniger Speicherplatz

---

## 🔐 Sicherheit

- ✅ Nur Admins können manuelle Bereinigung starten
- ✅ Rechnungen werden NIE gelöscht
- ✅ Gelöschte Daten können nicht wiederhergestellt werden
- ✅ Logging aller Bereinigungen

---

## 📅 Zeitstrahl

```
Auftrag abgeschlossen
    ↓
    │ 3 Monate warten
    ↓
Automatische Bereinigung (täglich 3:00 Uhr)
    ↓
    ├─ Hat Rechnung? → CMR/sensible Daten löschen, Rechnung behalten
    └─ Keine Rechnung? → Auftrag komplett löschen
```

---

**Status**: ✅ Aktiv seit 26. November 2025
**Version**: 1.0
**Nächste Bereinigung**: Täglich um 3:00 Uhr
