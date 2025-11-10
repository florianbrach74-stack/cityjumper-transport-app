# 🧪 Test-Plan: Mitarbeiter-Zuweisungssystem

## Vorbereitung

### 1. Datenbank-Migration ausführen
- [ ] Railway Dashboard öffnen
- [ ] SQL-Migration ausführen (siehe RAILWAY_MIGRATION_INSTRUCTIONS.md)
- [ ] Verifizierung erfolgreich

### 2. Test-Accounts erstellen
- [ ] Auftragnehmer-Account (contractor)
- [ ] 2-3 Mitarbeiter-Accounts (employee)
- [ ] Admin-Account (admin)

---

## Test-Szenarien

### Szenario 1: Einstellungen ändern (all_access → manual_assignment)

**Als Auftragnehmer:**

1. [ ] Login als Auftragnehmer
2. [ ] Navigiere zu `/employee-settings`
3. [ ] Standard-Einstellung ist "Alle Mitarbeiter sehen alle Aufträge" ✅
4. [ ] Wähle "Aufträge einzeln zuweisen"
5. [ ] Speichern erfolgreich ✅
6. [ ] Erfolgs-Meldung wird angezeigt ✅
7. [ ] Status zeigt "Aufträge müssen einzeln zugewiesen werden" ✅

**Erwartetes Ergebnis:**
- Einstellung wird gespeichert
- UI zeigt neuen Status
- Keine Fehler

---

### Szenario 2: Auftrag an Mitarbeiter zuweisen

**Als Auftragnehmer (mit manual_assignment):**

1. [ ] Navigiere zu `/contractor/orders`
2. [ ] Info-Box zeigt "Manuelle Zuweisung aktiv" ✅
3. [ ] Filter-Buttons sind sichtbar (Alle, Zugewiesen, Nicht zugewiesen) ✅
4. [ ] Wähle einen Auftrag
5. [ ] Klicke auf "Nicht zugewiesen" Dropdown
6. [ ] Mitarbeiter-Liste wird angezeigt ✅
7. [ ] Wähle einen Mitarbeiter
8. [ ] Dropdown zeigt jetzt Mitarbeiter-Namen ✅
9. [ ] Badge ist grün ✅

**Erwartetes Ergebnis:**
- Auftrag wird zugewiesen
- UI aktualisiert sich
- Mitarbeiter-Name wird angezeigt

---

### Szenario 3: Mitarbeiter sieht nur zugewiesene Aufträge

**Als Mitarbeiter (bei manual_assignment):**

1. [ ] Login als Mitarbeiter
2. [ ] Navigiere zum Dashboard
3. [ ] Nur zugewiesene Aufträge sind sichtbar ✅
4. [ ] Nicht zugewiesene Aufträge sind NICHT sichtbar ✅

**Als Auftragnehmer:**

5. [ ] Weise weiteren Auftrag an diesen Mitarbeiter zu
6. [ ] Logout und Login als Mitarbeiter
7. [ ] Neuer Auftrag ist jetzt sichtbar ✅

**Erwartetes Ergebnis:**
- Mitarbeiter sieht nur seine Aufträge
- Neue Zuweisungen erscheinen sofort

---

### Szenario 4: Alle Mitarbeiter sehen alles (all_access)

**Als Auftragnehmer:**

1. [ ] Navigiere zu `/employee-settings`
2. [ ] Wähle "Alle Mitarbeiter sehen alle Aufträge"
3. [ ] Speichern ✅

**Als Mitarbeiter:**

4. [ ] Login als Mitarbeiter
5. [ ] ALLE Aufträge des Auftragnehmers sind sichtbar ✅
6. [ ] Auch nicht zugewiesene Aufträge ✅

**Erwartetes Ergebnis:**
- Mitarbeiter sieht alle Aufträge
- Zuweisungen sind optional

---

### Szenario 5: Zuweisung entfernen

**Als Auftragnehmer:**

1. [ ] Navigiere zu `/contractor/orders`
2. [ ] Wähle zugewiesenen Auftrag
3. [ ] Klicke auf Mitarbeiter-Dropdown
4. [ ] Klicke "Zuweisung entfernen"
5. [ ] Dropdown zeigt "Nicht zugewiesen" ✅
6. [ ] Badge ist grau ✅

**Als Mitarbeiter (bei manual_assignment):**

7. [ ] Login als Mitarbeiter
8. [ ] Auftrag ist NICHT mehr sichtbar ✅

**Erwartetes Ergebnis:**
- Zuweisung wird entfernt
- Mitarbeiter sieht Auftrag nicht mehr

---

### Szenario 6: Filter-Funktionen

**Als Auftragnehmer (mit manual_assignment):**

1. [ ] Navigiere zu `/contractor/orders`
2. [ ] Klicke "Alle" → Alle Aufträge sichtbar ✅
3. [ ] Klicke "Zugewiesen" → Nur zugewiesene Aufträge ✅
4. [ ] Klicke "Nicht zugewiesen" → Nur nicht zugewiesene Aufträge ✅
5. [ ] Anzahl in Klammern ist korrekt ✅

**Erwartetes Ergebnis:**
- Filter funktionieren korrekt
- Anzahlen stimmen
- Keine Fehler

---

### Szenario 7: Admin-Ansicht

**Als Admin:**

1. [ ] Login als Admin
2. [ ] Navigiere zu Admin-Dashboard
3. [ ] Öffne Auftrags-Liste
4. [ ] Spalte "Zugewiesen an" ist sichtbar ✅
5. [ ] Zugewiesene Aufträge zeigen Mitarbeiter-Namen ✅
6. [ ] Nicht zugewiesene zeigen "Nicht zugewiesen" ✅

**Erwartetes Ergebnis:**
- Admin sieht alle Zuweisungen
- Klare Übersicht wer was fährt

---

### Szenario 8: Mehrere Mitarbeiter

**Als Auftragnehmer:**

1. [ ] Erstelle 3 Aufträge
2. [ ] Weise Auftrag 1 an Mitarbeiter A
3. [ ] Weise Auftrag 2 an Mitarbeiter B
4. [ ] Weise Auftrag 3 an Mitarbeiter A

**Als Mitarbeiter A:**

5. [ ] Login als Mitarbeiter A
6. [ ] Sieht Auftrag 1 und 3 ✅
7. [ ] Sieht NICHT Auftrag 2 ✅

**Als Mitarbeiter B:**

8. [ ] Login als Mitarbeiter B
9. [ ] Sieht Auftrag 2 ✅
10. [ ] Sieht NICHT Auftrag 1 und 3 ✅

**Erwartetes Ergebnis:**
- Jeder Mitarbeiter sieht nur seine Aufträge
- Keine Überschneidungen

---

### Szenario 9: Wechsel zwischen Modi

**Als Auftragnehmer:**

1. [ ] Modus: manual_assignment
2. [ ] Weise 2 Aufträge zu
3. [ ] Wechsle zu all_access
4. [ ] Alle Mitarbeiter sehen jetzt alle Aufträge ✅
5. [ ] Wechsle zurück zu manual_assignment
6. [ ] Alte Zuweisungen sind noch da ✅
7. [ ] Mitarbeiter sehen wieder nur zugewiesene ✅

**Erwartetes Ergebnis:**
- Modus-Wechsel funktioniert
- Zuweisungen bleiben erhalten
- Keine Datenverluste

---

### Szenario 10: Edge Cases

**Test 1: Kein Mitarbeiter vorhanden**

1. [ ] Auftragnehmer ohne Mitarbeiter
2. [ ] Dropdown zeigt "Keine Mitarbeiter verfügbar" ✅

**Test 2: Auftrag ohne Zuweisung löschen**

1. [ ] Nicht zugewiesener Auftrag
2. [ ] Auftrag löschen/stornieren
3. [ ] Keine Fehler ✅

**Test 3: Mitarbeiter löschen mit Zuweisungen**

1. [ ] Mitarbeiter mit zugewiesenen Aufträgen
2. [ ] Mitarbeiter löschen
3. [ ] Aufträge werden auf "Nicht zugewiesen" gesetzt ✅
4. [ ] Keine Fehler ✅

---

## API-Tests

### GET /api/employee-assignment/settings

```bash
curl -H "Authorization: Bearer <token>" \
  https://cityjumper-api-production-01e4.up.railway.app/api/employee-assignment/settings
```

**Erwartete Response:**
```json
{
  "assignmentMode": "all_access"
}
```

---

### PUT /api/employee-assignment/settings

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"assignmentMode": "manual_assignment"}' \
  https://cityjumper-api-production-01e4.up.railway.app/api/employee-assignment/settings
```

**Erwartete Response:**
```json
{
  "message": "Einstellungen aktualisiert",
  "assignmentMode": "manual_assignment"
}
```

---

### GET /api/employee-assignment/employees

```bash
curl -H "Authorization: Bearer <token>" \
  https://cityjumper-api-production-01e4.up.railway.app/api/employee-assignment/employees
```

**Erwartete Response:**
```json
[
  {
    "id": 123,
    "first_name": "Max",
    "last_name": "Mustermann",
    "email": "max@example.com",
    "phone": "0172 123 4567"
  }
]
```

---

### POST /api/employee-assignment/orders/:orderId/assign

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": 123}' \
  https://cityjumper-api-production-01e4.up.railway.app/api/employee-assignment/orders/456/assign
```

**Erwartete Response:**
```json
{
  "message": "Auftrag zugewiesen",
  "order": {
    "id": 456,
    "assigned_employee_id": 123,
    "employee_first_name": "Max",
    "employee_last_name": "Mustermann",
    ...
  }
}
```

---

## Performance-Tests

### Ladezeiten

- [ ] Einstellungs-Seite lädt < 1s
- [ ] Auftrags-Liste lädt < 2s
- [ ] Dropdown öffnet < 0.5s
- [ ] Zuweisung speichert < 1s

### Gleichzeitige Zuweisungen

- [ ] 2 Auftragnehmer weisen gleichzeitig zu
- [ ] Keine Konflikte
- [ ] Alle Zuweisungen korrekt

---

## Browser-Tests

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile (iOS)
- [ ] Mobile (Android)

---

## Fehlerbehandlung

### Netzwerkfehler

- [ ] Offline-Modus
- [ ] Timeout
- [ ] Server-Fehler
- [ ] Fehlermeldungen werden angezeigt

### Validierung

- [ ] Ungültiger Mitarbeiter
- [ ] Ungültiger Auftrag
- [ ] Fehlende Berechtigung
- [ ] Korrekte Fehlermeldungen

---

## ✅ Checkliste

- [ ] Alle Szenarien getestet
- [ ] API-Tests erfolgreich
- [ ] Performance akzeptabel
- [ ] Browser-Kompatibilität
- [ ] Fehlerbehandlung funktioniert
- [ ] Dokumentation aktualisiert
- [ ] Bereit für Production

---

**Status:** Bereit für Testing! 🧪
**Geschätzte Testdauer:** 2-3 Stunden
