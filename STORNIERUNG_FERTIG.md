# ✅ Stornierungssystem - FERTIG!

## 🎉 Was implementiert wurde:

### ✅ Backend (100% fertig):

#### 1. Datenbank:
- ✅ Alle Spalten hinzugefügt
- ✅ `available_budget` - Budget für Neuvermittlung
- ✅ `adjusted_contractor_price` - Angepasster Preis
- ✅ `contractor_penalty` - Strafe für AN
- ✅ `customer_cancellation_fee` - Gebühr für Kunde
- ✅ `hours_before_pickup` - Stunden bis Abholung
- ✅ `platform_profit_from_cancellation` - Plattform-Gewinn

#### 2. API-Endpunkte:

**Auftragnehmer-Stornierung:**
```
POST /api/cancellation/:orderId/cancel-by-contractor
Body: { reason, notes }

Automatisch:
- Berechnet Penalty (0%, 50%, 75%, 100%)
- Berechnet verfügbares Budget
- Status zurück auf 'pending'
- Kunde erfährt nichts
```

**Preis-Anpassung:**
```
POST /api/cancellation/:orderId/adjust-contractor-price
Body: { newContractorPrice }

Validierung:
- Preis <= verfügbares Budget
- Berechnet Plattform-Gewinn
- Kunde zahlt weiterhin nur ursprünglichen Preis
```

**Kunden-Stornierung:**
```
POST /api/cancellation/:orderId/cancel-by-customer
Body: { reason }

Automatisch:
- Berechnet Gebühr (0%, 50%, 75%, 100%)
- AN bekommt Entschädigung (85%)
- Status auf 'completed'
```

**Vorschau:**
```
GET /api/cancellation/:orderId/cancellation-preview

Zeigt Gebühren ohne zu committen
```

---

### ✅ Frontend (bereits vorhanden):

#### Komponenten:
- ✅ `CancellationModal.jsx` - Stornierungsmodal (existiert)
- ✅ Admin kann AN-Stornierung durchführen
- ✅ Kunde kann stornieren mit Gebührenvorschau

#### Was noch zu tun ist (optional):
- [ ] Preis-Anpassungs-UI im Admin-Dashboard
- [ ] Anzeige von stornierten Aufträgen mit Budget
- [ ] Button "Preis anpassen" nach AN-Stornierung

---

## 📊 Beispiel-Ablauf:

### Szenario: AN storniert 10h vor Abholung

```
1. Admin öffnet Auftrag #123
   - Kundenpreis: €100
   - AN zugewiesen: Max Mustermann
   
2. Admin klickt "AN-Stornierung"
   - Grund: "Fahrzeugausfall"
   
3. System berechnet automatisch:
   - AN hätte bekommen: €85 (85% von €100)
   - Stunden bis Abholung: 10h
   - Penalty: €63,75 (75% von €85, weil <12h)
   - Verfügbares Budget: €163,75 (€100 + €63,75)
   
4. Auftrag wird aktualisiert:
   - Status: 'pending'
   - contractor_id: NULL
   - available_budget: €163,75
   - contractor_penalty: €63,75
   
5. Admin kann jetzt Preis erhöhen:
   - Neuer Preis: €110
   - Plattform-Gewinn: €53,75 (€163,75 - €110)
   
6. Neuer AN sieht: €110
   Kunde zahlt: €100 (unverändert)
   Plattform verdient: €53,75
```

---

## 🎯 Wie es nutzen:

### Als Admin:

#### Auftragnehmer storniert:
1. Gehe zu Auftrag im Admin-Dashboard
2. Klicke "Stornieren" → "Auftragnehmer-Stornierung"
3. Gib Grund ein (z.B. "Fahrzeugausfall")
4. System berechnet automatisch Penalty und Budget
5. Auftrag ist wieder "pending" und kann neu vergeben werden

#### Preis erhöhen (nach AN-Stornierung):
1. Auftrag hat `available_budget` (z.B. €163,75)
2. API-Call: `POST /api/cancellation/123/adjust-contractor-price`
3. Body: `{ "newContractorPrice": 110 }`
4. Neuer AN sieht €110, Kunde zahlt €100

### Als Kunde:
1. Gehe zu "Meine Aufträge"
2. Klicke "Stornieren"
3. Siehe Gebührenvorschau
4. Bestätige Stornierung
5. Zahle nur Stornierungsgebühr (je nach Zeitpunkt)

---

## 📋 AGB-Gebührenordnung (§7):

### Kunde storniert:
- **>24h:** 0% (kostenfrei)
- **12-24h:** 50% des Auftragswertes
- **2-12h:** 75% des Auftragswertes
- **<2h:** 100% des Auftragswertes

### Auftragnehmer storniert:
- **>24h:** 0% (kostenfrei)
- **12-24h:** 50% von dem was er bekommen hätte (85%)
- **2-12h:** 75% von dem was er bekommen hätte
- **<2h:** 100% von dem was er bekommen hätte

**Wichtig:** Penalty wird von dem berechnet was AN bekommen hätte (85%), nicht vom Kundenpreis!

---

## 🚀 Deployment:

✅ **Backend deployed** (Railway)
✅ **Datenbank migriert**
✅ **API-Endpunkte live**

### Testen:

```bash
# Auftragnehmer-Stornierung
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/cancellation/123/cancel-by-contractor \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Fahrzeugausfall", "notes": "Test"}'

# Preis anpassen
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/cancellation/123/adjust-contractor-price \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newContractorPrice": 110}'
```

---

## ✅ Status: PRODUCTION READY!

Das Stornierungssystem ist vollständig implementiert und einsatzbereit!

**Was funktioniert:**
- ✅ Automatische Penalty-Berechnung
- ✅ Verfügbares Budget für Neuvermittlung
- ✅ Preis-Anpassung durch Admin
- ✅ Kunde zahlt nur ursprünglichen Preis
- ✅ Plattform behält Differenz
- ✅ Alle Stornierungen werden dokumentiert

**Optional (kann später hinzugefügt werden):**
- [ ] UI für Preis-Anpassung im Admin-Dashboard
- [ ] Filter für stornierte Aufträge
- [ ] Statistiken über Stornierungen

---

**Datum:** 26. November 2025
**Status:** ✅ FERTIG & DEPLOYED
