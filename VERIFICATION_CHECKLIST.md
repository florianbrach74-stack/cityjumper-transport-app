# VOLLSTÄNDIGE SYSTEM-VERIFIKATION
**Datum:** 18.11.2025, 17:05 Uhr

## ✅ DEPLOYMENT STATUS

### Git Status
- ✅ Alle Commits gepusht (letzter: e8b755a)
- ✅ Railway Projekt: energetic-art (production)
- ✅ Letzter Deploy: Automatic price reduction on cancellation

### Dateien
- ✅ `client/src/content/agb.js` existiert (12.642 bytes)
- ✅ AGBs enthalten §1-13 vollständig
- ✅ §7 Stornierung: Korrekte Gebühren (12h/2h Staffelung)
- ✅ §13 Kundenschutzvereinbarung: Vollständig mit §1-6

---

## 🔍 ZU PRÜFENDE FEATURES

### 1. AGBs Online (§1-13)
**URL:** https://www.courierly.de/agb

**Zu prüfen:**
- [ ] §1-6: Grundlegende Bedingungen
- [ ] §7: Stornierungsgebühren (12h/2h Struktur)
- [ ] §8: Haftung und Versicherung
- [ ] §9: Höhere Gewalt
- [ ] §10: Datenschutz
- [ ] §11: Verbraucherinformationen
- [ ] §12: Gerichtsstand
- [ ] §13: Kundenschutzvereinbarung (mit Subsections)

**Test:**
```bash
curl https://www.courierly.de/agb | grep "Kundenschutzvereinbarung"
```

---

### 2. Datenbank-Migration
**Spalten:** `needs_loading_help`, `needs_unloading_help`, `loading_help_fee`, `legal_delivery`

**Test-Route:**
```javascript
fetch('https://cityjumper-api-production-01e4.up.railway.app/api/run-loading-help-migration', { 
  method: 'POST' 
})
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "columns": [
    {"column_name": "legal_delivery", "data_type": "boolean"},
    {"column_name": "loading_help_fee", "data_type": "numeric"},
    {"column_name": "needs_loading_help", "data_type": "boolean"},
    {"column_name": "needs_unloading_help", "data_type": "boolean"}
  ]
}
```

---

### 3. Badges in Dashboards
**Zu prüfen:**
- [ ] Customer Dashboard: ⚖️ 📦 📤 Badges in Tabelle
- [ ] Contractor Dashboard: ⚖️ 📦 📤 Badges in Order Cards
- [ ] Admin Dashboard: ⚖️ 📦 📤 Badges in Tabelle

**Test:** Neuen Auftrag erstellen mit:
- ✅ Beladehilfe benötigt
- ✅ Entladehilfe benötigt
- ✅ Rechtssichere Zustellung

---

### 4. Stornierungsfunktion
**Zu prüfen:**
- [ ] "Stornieren" Button in Customer Dashboard sichtbar
- [ ] CancellationModal öffnet sich
- [ ] Gebührenberechnung korrekt:
  - >24h: 0%
  - 12-24h: 50%
  - 2-12h: 75%
  - <2h: 100%

**Backend-Test:**
```javascript
// Stornierung 6h vor Abholung (75% Gebühr)
fetch('https://cityjumper-api-production-01e4.up.railway.app/api/cancellation/ORDER_ID/cancellation-preview', {
  headers: { 'Authorization': 'Bearer TOKEN' }
})
```

**Erwartetes Ergebnis:**
```json
{
  "preview": {
    "hoursUntilPickup": 6.0,
    "feePercentage": 75,
    "cancellationFee": 75.00
  }
}
```

---

### 5. Preisreduktion bei Stornierung
**Beispiel:** Auftrag für €100 (Contractor €85), 6h vor Abholung storniert

**Erwartetes Verhalten:**
- Status → `completed` (nicht `cancelled`)
- `price` → €75 (75% von €100)
- `contractor_price` → €63.75 (75% von €85)
- `cancellation_fee` → €75
- `cancellation_fee_percentage` → 75

**Anzeige:**
- Contractor Dashboard: "€63.75" + "⚠️ Storniert: 75% Gebühr"
- Admin Dashboard: "🚚 €63.75 (75% Stornogebühr)"

---

### 6. Kundenschutz in Bid Form
**Zu prüfen:**
- [ ] Checkbox "Kundenschutzvereinbarung" vorhanden
- [ ] Link zu AGBs funktioniert
- [ ] Formular-Validierung: Kann nicht absenden ohne Checkbox
- [ ] Fehlermeldung: "Bitte bestätigen Sie die Kundenschutzvereinbarung"

---

### 7. Order Creation
**Zu prüfen:**
- [ ] Checkboxen für Beladehilfe/Entladehilfe/Rechtssichere Zustellung
- [ ] Preis wird automatisch aktualisiert (+€6 pro Service)
- [ ] Felder werden in Datenbank gespeichert

**Test:** Neuen Auftrag erstellen und in DB prüfen:
```sql
SELECT 
  id, 
  needs_loading_help, 
  needs_unloading_help, 
  loading_help_fee, 
  legal_delivery 
FROM transport_orders 
WHERE id = LATEST_ORDER_ID;
```

---

## 🚨 BEKANNTE PROBLEME

### Problem 1: AGBs nicht online sichtbar
**Mögliche Ursachen:**
1. Vercel Cache nicht geleert
2. Frontend nicht neu deployed
3. Import-Pfad falsch

**Lösung:**
```bash
# Vercel neu deployen
vercel --prod

# Oder Hard Refresh im Browser
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)
```

### Problem 2: Badges nicht sichtbar
**Ursache:** Alte Aufträge haben keine Werte in neuen Spalten

**Lösung:** Test-Auftrag #22 aktualisieren:
```javascript
fetch('https://cityjumper-api-production-01e4.up.railway.app/api/test-update-order-22', { 
  method: 'POST' 
})
```

---

## ✅ FINALE CHECKLISTE

- [ ] AGBs online unter /agb sichtbar
- [ ] §13 Kundenschutz vollständig
- [ ] Migration erfolgreich (alle 4 Spalten vorhanden)
- [ ] Badges in allen 3 Dashboards
- [ ] Storno-Button funktioniert
- [ ] Gebührenberechnung korrekt (12h/2h)
- [ ] Preisreduktion bei Stornierung
- [ ] Kundenschutz-Checkbox in Bid Form
- [ ] Neuer Auftrag speichert alle Felder

---

## 🔧 SCHNELLTEST-BEFEHLE

```bash
# 1. Migration prüfen
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/run-loading-help-migration

# 2. Test-Auftrag aktualisieren
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/test-update-order-22

# 3. AGBs prüfen
curl https://www.courierly.de/agb | grep "Kundenschutzvereinbarung"
```

---

## 📊 DEPLOYMENT-INFO

**Railway:**
- Projekt: energetic-art
- Environment: production
- Service: cityjumper-api
- Auto-Deploy: ✅ Aktiv

**Vercel:**
- Frontend: www.courierly.de
- Auto-Deploy: ✅ Aktiv (bei Push zu main)

**Letzter Deploy:**
- Backend: e8b755a (Automatic price reduction)
- Frontend: Sollte automatisch deployen

---

## 🎯 NÄCHSTE SCHRITTE

1. **AGBs prüfen:** Browser öffnen → https://www.courierly.de/agb
2. **Migration ausführen:** Console → `fetch('/api/run-loading-help-migration', {method: 'POST'})`
3. **Test-Auftrag erstellen:** Mit allen Features aktiviert
4. **Stornierung testen:** 6h vor Abholung → Preis prüfen
5. **Alle Dashboards prüfen:** Customer, Contractor, Admin

**ALLES SOLLTE FUNKTIONIEREN!** ✅
