# Multi-Stop Zeitfenster - Benutzerhandbuch

## 📋 Übersicht

Dieses Feature ermöglicht es, für zusätzliche Zustellungen eigene Zeitfenster zu definieren. Dies ist besonders nützlich wenn:
- Geschäfte unterschiedliche Öffnungszeiten haben
- Zustellungen zeitlich koordiniert werden müssen
- Mehrere Stops an einem Tag geplant sind

---

## 🎯 Funktionen

### 1. Zeitfenster für zusätzliche Zustellungen

Bei der Auftragserstellung können Sie für jeden zusätzlichen Zustellstopp ein eigenes Zeitfenster angeben:

**Zustellung VON:** Früheste Zustellzeit (z.B. Ladenöffnung um 07:00)
**Zustellung BIS:** Späteste Zustellzeit (mindestens Hauptzustellung BIS + 10 Minuten)

### 2. Automatische Validierung

Das System prüft automatisch:
- ✅ Zustellung BIS ist mindestens 10 Minuten nach Hauptzustellung BIS
- ✅ Zustellung BIS ist nach Zustellung VON
- ✅ Hauptzustellzeit wurde eingegeben

### 3. Anzeige überall

Zeitfenster werden angezeigt in:
- Admin-Bereich (Auftragsdetails)
- Contractor-Dashboard (Auftragsübersicht)
- Mitarbeiter-Dashboard (Zugewiesene Aufträge)

---

## 📖 Anleitung

### Auftrag mit Multi-Stop erstellen

1. **Hauptauftrag eingeben**
   - Abholadresse und Zeitfenster
   - Zustelladresse und Zeitfenster
   - Ladegut-Details

2. **Zusätzliche Zustellung hinzufügen**
   - Klicke auf "Zustellung hinzufügen"
   - Gib die Adresse ein (mit Autovervollständigung)
   - **Wichtig:** Gib zuerst die Hauptzustellzeit oben ein!

3. **Zeitfenster eingeben**
   - **Zustellung VON:** Wähle die früheste Zustellzeit (z.B. 07:00)
   - **Zustellung BIS:** Wähle die späteste Zustellzeit (mind. Hauptzustellung BIS + 10 Min)
   - Beispiel: Hauptzustellung bis 14:00 → Zusätzliche Zustellung bis mind. 14:10

4. **Validierung beachten**
   - ⚠️ Wenn Hauptzustellzeit fehlt: Warnung erscheint
   - ❌ Wenn Zustellung BIS zu früh: Fehlermeldung mit Mindestzeit
   - ❌ Wenn Zustellung BIS vor Zustellung VON: Fehlermeldung

---

## 💡 Beispiele

### Beispiel 1: Geschäfte mit unterschiedlichen Öffnungszeiten

**Hauptzustellung:**
- Adresse: Adolf-Menzel-Straße 71, 12621 Berlin
- Zeitfenster: 10:00 - 14:00

**Zusätzliche Zustellung:**
- Adresse: am Amtsgraben 28, 12559 Berlin
- Zeitfenster: 07:00 - 14:10 ✅
- Begründung: Geschäft öffnet um 07:00, muss aber nach Hauptzustellung beliefert werden

### Beispiel 2: Zeitlich koordinierte Zustellungen

**Hauptzustellung:**
- Zeitfenster: 08:00 - 12:00

**Zusätzliche Zustellung 1:**
- Zeitfenster: 09:00 - 12:10 ✅
- Begründung: Kann ab 09:00 beliefert werden

**Zusätzliche Zustellung 2:**
- Zeitfenster: 13:00 - 16:00 ✅
- Begründung: Nachmittagslieferung nach Hauptzustellung

### Beispiel 3: Fehlerhafte Eingabe

**Hauptzustellung:**
- Zeitfenster: 10:00 - 14:00

**Zusätzliche Zustellung:**
- Zeitfenster: 07:00 - 14:00 ❌
- Fehler: "Zustellung BIS muss mindestens 14:10 sein (Hauptzustellung BIS + 10 Min)"

**Korrektur:**
- Zeitfenster: 07:00 - 14:10 ✅

---

## 🔍 Zeitfenster anzeigen

### Als Admin

1. Gehe zu "Aktive Aufträge"
2. Klicke auf einen Auftrag mit Multi-Stops
3. Im Detail-Modal siehst du:
   - Hauptabholung: 📅 Datum • ⏰ Zeit
   - Hauptzustellung: 📅 Datum • ⏰ Zeit
   - Zusätzliche Abholungen: Adresse + ⏰ Zeit (grün)
   - Zusätzliche Zustellungen: Adresse + ⏰ Zeit (blau)

### Als Contractor

1. Gehe zu "Meine Aufträge"
2. Aufträge mit Multi-Stops zeigen:
   - 🚚 MULTI-STOP: X Adressen
   - Alle PLZ: 12557 → 12621 → 12559
3. Bei angenommenen Aufträgen:
   - Vollständige Adressen
   - Zeitfenster für jeden Stop

### Als Mitarbeiter

1. Gehe zu "Meine Aufträge"
2. Zugewiesene Aufträge zeigen:
   - Vollständige Route mit allen Stops
   - Zeitfenster für Abholung und Zustellung
   - Zeitfenster für zusätzliche Stops
   - Cargo-Details

---

## ⚙️ Technische Details

### Datenstruktur

**Hauptzeitfenster:**
```
pickup_time_from: "10:00"
pickup_time_to: "11:00"
delivery_time_from: "14:00"
delivery_time_to: "16:00"
```

**Stop-Zeitfenster (JSON):**
```json
{
  "delivery_stops": [
    {
      "address": "am Amtsgraben 28",
      "city": "Berlin",
      "postal_code": "12559",
      "contact_name": "Max Mustermann",
      "time_start": "07:00",
      "time_end": "14:10"
    }
  ]
}
```

### Validierungsregeln

```javascript
// Regel 1: Hauptzustellzeit muss vorhanden sein
if (!mainDeliveryTimeEnd) {
  alert('Bitte zuerst die Hauptzustellzeit eingeben');
}

// Regel 2: Zustellung BIS >= Hauptzustellung BIS + 10 Min
const minEndTime = addMinutes(mainDeliveryTimeEnd, 10);
if (deliveryTimeEnd < minEndTime) {
  alert(`Zustellung BIS muss mindestens ${minEndTime} sein`);
}

// Regel 3: Zustellung BIS > Zustellung VON
if (deliveryTimeEnd <= deliveryTimeStart) {
  alert('Zustellung BIS muss nach Zustellung VON sein');
}
```

---

## 🐛 Fehlerbehebung

### Problem: Zeitfelder werden nicht angezeigt

**Lösung:** Gib zuerst die Hauptzustellzeit (Zustellung BIS) oben im Formular ein.

### Problem: "Zustellung BIS muss mindestens X sein"

**Lösung:** Die Zustellung BIS muss mindestens 10 Minuten nach der Hauptzustellung BIS sein. Passe die Zeit entsprechend an.

### Problem: Mitarbeiter sieht zugewiesene Aufträge nicht

**Lösung:** 
1. Prüfe ob der Auftrag den Status 'accepted', 'approved', 'picked_up' oder 'in_transit' hat
2. Prüfe ob der Mitarbeiter dem richtigen Contractor zugeordnet ist
3. Prüfe den Assignment Mode (Manual vs. All Access)

### Problem: Zeitfenster werden nicht gespeichert

**Lösung:** Die Zeitfenster werden automatisch als Teil der Stop-Daten gespeichert. Prüfe ob die Stops korrekt hinzugefügt wurden.

---

## 📊 Status-Übersicht

### Auftragsstatus und Sichtbarkeit

| Status | Mitarbeiter (Manual) | Mitarbeiter (All Access) | Contractor | Admin |
|--------|---------------------|-------------------------|------------|-------|
| pending | ❌ | ❌ | ❌ | ✅ |
| approved | ✅ (wenn zugewiesen) | ✅ (alle + eigene) | ✅ | ✅ |
| accepted | ✅ (wenn zugewiesen) | ✅ (eigene) | ✅ | ✅ |
| picked_up | ✅ (wenn zugewiesen) | ✅ (eigene) | ✅ | ✅ |
| in_transit | ✅ (wenn zugewiesen) | ✅ (eigene) | ✅ | ✅ |
| completed | ❌ | ✅ (eigene) | ✅ | ✅ |

---

## 🎓 Best Practices

### 1. Zeitfenster planen
- Berücksichtige Öffnungszeiten der Empfänger
- Plane Pufferzeiten zwischen Stops ein
- Beachte Verkehrslage und Entfernungen

### 2. Realistische Zeiten
- Mindestens 10 Minuten zwischen Hauptzustellung und zusätzlichen Stops
- Genug Zeit für Entladung und Fahrt zum nächsten Stop
- Berücksichtige Wartezeiten

### 3. Kommunikation
- Informiere Empfänger über geplante Zeitfenster
- Aktualisiere Zeiten bei Verzögerungen
- Nutze die Kontaktdaten für Rückfragen

---

## 📞 Support

Bei Fragen oder Problemen:
- **Email:** support@cityjumper.de
- **Telefon:** +49 XXX XXXXXXX
- **Dokumentation:** Siehe SESSION_2025-12-03_MULTI_STOP_TIMES.md

---

**Version:** 1.0
**Letzte Aktualisierung:** 2025-12-03
**Status:** ✅ Produktiv
