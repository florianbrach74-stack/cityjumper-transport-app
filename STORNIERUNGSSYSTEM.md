# 🔴 Stornierungssystem - Vollständige Spezifikation

## Fall 1: Auftragnehmer storniert

### Ausgangssituation:
- Kunde zahlt: €100
- Auftragnehmer bekommt: €85 (85%)
- Plattform bekommt: €15 (15%)

### Nach Stornierung durch Auftragnehmer:

#### Finanzielle Auswirkungen:
```
Kunde zahlt: €100 (unverändert, erfährt nichts)
Auftragnehmer Strafe: €42,50 (50% von €85)
Neues Budget: €100 + €42,50 = €142,50
```

#### Admin-Optionen:

**Option A: Preis erhöhen (z.B. auf €110)**
```
Neuer Auftragnehmer sieht: €110
Neuer Auftragnehmer bekommt: €110
Plattform Gewinn: €142,50 - €110 = €32,50
```

**Option B: Ohne Erhöhung (€85)**
```
Neuer Auftragnehmer sieht: €85
Neuer Auftragnehmer bekommt: €85
Plattform Gewinn: €142,50 - €85 = €57,50
```

#### Status-Änderungen:
- ❌ **NICHT** auf "abgeschlossen" setzen
- ✅ Zurück auf "pending"
- ✅ Auftrag kann neu vergeben werden
- ✅ Kunde sieht: "In Bearbeitung" / "Offen"

#### Datenbank:
```sql
status = 'pending'
contractor_id = NULL
cancellation_status = 'cancelled_by_contractor'
contractor_penalty = 42.50
customer_compensation = 0.00
available_budget = 142.50
new_contractor_price = 110.00  -- Admin kann anpassen
```

---

## Fall 2: Kunde storniert

### Gebühren laut AGB (§7.1):

#### a) >24 Stunden vor Abholzeit:
```
Stornierungsgebühr: 0%
Kunde zahlt: €0
Auftragnehmer bekommt: €0
Status: 'completed' (cancelled_by_customer)
```

#### b) <24 Stunden vor Abholzeit:
```
Stornierungsgebühr: 50% der Frachtkosten
Kunde zahlt: €50 (50% von €100)
Auftragnehmer bekommt: €42,50 (85% von €50)
Plattform behält: €7,50 (15% von €50)
Status: 'completed' (cancelled_by_customer)
```

#### c) Auftrag bereits gestartet:
```
Stornierungsgebühr: 75% der Frachtkosten
Kunde zahlt: €75 (75% von €100)
Auftragnehmer bekommt: €63,75 (85% von €75)
Plattform behält: €11,25 (15% von €75)
Status: 'completed' (cancelled_by_customer)
```

#### Status-Änderungen:
- ✅ Auf "abgeschlossen" setzen
- ✅ Für alle Beteiligten als "abgeschlossen" markiert
- ✅ Gebühren werden berechnet und abgerechnet

#### Datenbank:
```sql
status = 'completed'
cancellation_status = 'cancelled_by_customer'
cancellation_timestamp = NOW()
customer_cancellation_fee = 50.00  -- je nach Zeitpunkt
contractor_compensation = 42.50
hours_before_pickup = 12  -- Beispiel
```

---

## Implementierung TODO:

### 1. Backend: Stornierungslogik
- [ ] `POST /api/admin/orders/:id/cancel-by-contractor`
  - Berechne Strafe (50% von contractor_payout)
  - Setze Status auf 'pending'
  - Speichere available_budget
  - Setze contractor_id = NULL

- [ ] `POST /api/admin/orders/:id/adjust-price`
  - Admin kann neuen Preis setzen
  - Validierung: new_price <= available_budget

- [ ] `POST /api/orders/:id/cancel-by-customer`
  - Berechne Stunden bis Abholzeit
  - Berechne Gebühr (0%, 50%, 75%)
  - Setze Status auf 'completed'
  - Berechne Auftragnehmer-Entschädigung

### 2. Frontend: Admin-Dashboard
- [ ] Button "Auftragnehmer-Stornierung"
- [ ] Modal: Strafe anzeigen (€42,50)
- [ ] Button "Preis anpassen" nach Stornierung
- [ ] Input: Neuer Vermittlungspreis
- [ ] Anzeige: Verfügbares Budget

### 3. Frontend: Kunden-Dashboard
- [ ] Button "Auftrag stornieren"
- [ ] Warnung: Gebühren anzeigen (je nach Zeitpunkt)
- [ ] Bestätigung erforderlich

### 4. Datenbank-Änderungen
```sql
ALTER TABLE orders ADD COLUMN contractor_penalty DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN available_budget DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN new_contractor_price DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN customer_cancellation_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN contractor_compensation DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN hours_before_pickup INTEGER;
```

---

## Wichtige Regeln:

1. ✅ Kunde erfährt NIE vom erhöhten Vermittlungspreis
2. ✅ Kunde zahlt immer nur den ursprünglichen Preis
3. ✅ Auftragnehmer-Stornierung → Status: 'pending' (nicht abgeschlossen!)
4. ✅ Kunden-Stornierung → Status: 'completed' (abgeschlossen!)
5. ✅ Plattform behält Differenz zwischen Budget und neuem Preis
6. ✅ Alle Stornierungen werden dokumentiert und sind nachvollziehbar

---

**Status:** Spezifikation komplett - Bereit zur Implementierung
