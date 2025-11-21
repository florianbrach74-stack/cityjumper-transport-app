# 🚀 BIDS-SYSTEM (Bewerbungssystem) - Zukünftiges Feature

## 📋 ÜBERSICHT

Das Bids-System ist ein **optionales Feature**, das es Auftragnehmern ermöglicht, sich selbst auf Aufträge zu bewerben, anstatt vom Admin zugewiesen zu werden.

**Status:** ⏳ Nicht implementiert (für Zukunft vorbereitet)

---

## 🎯 KONZEPT

### **AKTUELLER WORKFLOW (ohne Bids):**
```
1. Kunde erstellt Auftrag
2. Admin sieht Auftrag im Dashboard
3. Admin wählt Auftragnehmer manuell aus
4. Auftragnehmer führt Auftrag aus
```

### **ZUKÜNFTIGER WORKFLOW (mit Bids):**
```
1. Kunde erstellt Auftrag
2. Auftrag erscheint in "Verfügbare Aufträge"
3. Auftragnehmer bewerben sich mit eigenem Preis
4. Admin sieht alle Bewerbungen
5. Admin wählt beste Bewerbung aus
6. Gewählter Auftragnehmer führt Auftrag aus
```

---

## 💡 VORTEILE

### **Für Admins:**
- ✅ Wettbewerb zwischen Fahrern
- ✅ Bessere Preise durch Marktmechanismus
- ✅ Weniger manuelle Suche nach Fahrern
- ✅ Transparenz über verfügbare Kapazitäten

### **Für Auftragnehmer:**
- ✅ Selbstständige Auftragssuche
- ✅ Eigene Preisgestaltung
- ✅ Flexibilität bei Auftragsannahme
- ✅ Mehr Kontrolle über Auslastung

### **Für Kunden:**
- ✅ Schnellere Vermittlung
- ✅ Potenziell bessere Preise
- ✅ Mehr verfügbare Fahrer

---

## ⚠️ NACHTEILE

- ❌ Mehr Komplexität im System
- ❌ Admin muss Bewerbungen prüfen
- ❌ Potenzieller Preisdruck auf Fahrer
- ❌ Mehr Kommunikationsaufwand
- ❌ Risiko von Qualitätsverlust

---

## 🗄️ DATENBANK-STRUKTUR

### **Tabelle: `bids`**

```sql
CREATE TABLE bids (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES transport_orders(id) ON DELETE CASCADE,
  contractor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_price DECIMAL(10, 2) NOT NULL,
  contractor_note TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  CONSTRAINT bids_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  CONSTRAINT bids_unique_bid UNIQUE (order_id, contractor_id)
);

-- Indexes
CREATE INDEX idx_bids_order_id ON bids(order_id);
CREATE INDEX idx_bids_contractor_id ON bids(contractor_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_created_at ON bids(created_at DESC);
```

---

## 🔧 BACKEND-IMPLEMENTIERUNG

### **API Endpoints:**

```javascript
// Bewerbung erstellen
POST /api/bids
Body: {
  order_id: 123,
  bid_price: 150.00,
  contractor_note: "Ich kann den Auftrag sofort übernehmen"
}

// Bewerbungen für einen Auftrag abrufen (Admin)
GET /api/bids/order/:orderId

// Eigene Bewerbungen abrufen (Contractor)
GET /api/bids/my-bids

// Bewerbung akzeptieren (Admin)
PATCH /api/bids/:bidId/accept

// Bewerbung ablehnen (Admin)
PATCH /api/bids/:bidId/reject
Body: {
  rejection_reason: "Preis zu hoch"
}

// Bewerbung zurückziehen (Contractor)
PATCH /api/bids/:bidId/withdraw
```

---

## 🎨 FRONTEND-KOMPONENTEN

### **Für Auftragnehmer:**
1. **AvailableOrdersList.jsx**
   - Liste aller offenen Aufträge
   - Filter nach PLZ, Datum, Preis
   - "Bewerben"-Button

2. **BidModal.jsx**
   - Formular für Bewerbung
   - Eigener Preis-Vorschlag
   - Notiz-Feld
   - Vorschau der Marge

3. **MyBidsList.jsx**
   - Übersicht eigener Bewerbungen
   - Status (pending, accepted, rejected)
   - Zurückziehen-Funktion

### **Für Admins:**
4. **OrderBidsModal.jsx**
   - Liste aller Bewerbungen für einen Auftrag
   - Sortierung nach Preis
   - Akzeptieren/Ablehnen-Buttons
   - Vergleichsansicht

---

## 📊 GESCHÄFTSLOGIK

### **Bewerbungs-Regeln:**
- ✅ Nur verifizierte Auftragnehmer können sich bewerben
- ✅ Preis muss >= Mindestlohn sein
- ✅ Nur eine Bewerbung pro Auftrag pro Auftragnehmer
- ✅ Bewerbungen nur für "pending" Aufträge
- ✅ Automatische Benachrichtigung an Admin

### **Akzeptanz-Regeln:**
- ✅ Nur Admin kann Bewerbungen akzeptieren
- ✅ Bei Akzeptanz werden alle anderen Bewerbungen abgelehnt
- ✅ Auftrag wird dem Auftragnehmer zugewiesen
- ✅ Status ändert sich zu "accepted"
- ✅ Email-Benachrichtigung an Auftragnehmer

### **Preis-Logik:**
- ✅ Auftragnehmer sieht Kundenpreis
- ✅ Auftragnehmer schlägt eigenen Preis vor
- ✅ System zeigt Marge an
- ✅ Admin sieht alle Preise im Vergleich

---

## 🔔 BENACHRICHTIGUNGEN

### **Email-Benachrichtigungen:**
1. **An Admin:** Neue Bewerbung eingegangen
2. **An Contractor:** Bewerbung akzeptiert
3. **An Contractor:** Bewerbung abgelehnt
4. **An Contractor:** Auftrag wurde anderweitig vergeben

### **In-App-Benachrichtigungen:**
- Badge mit Anzahl neuer Bewerbungen
- Push-Benachrichtigungen (optional)

---

## 📱 UI/UX MOCKUPS

### **Contractor Dashboard:**
```
┌─────────────────────────────────────────┐
│ 📦 Verfügbare Aufträge (15)             │
├─────────────────────────────────────────┤
│ Filter: [PLZ] [Datum] [Preis]          │
├─────────────────────────────────────────┤
│ #123 | Berlin → München                │
│ 📅 25.11.2025 | 💰 €250.00             │
│ 📍 10115 → 80335 | 🚚 Transporter      │
│ [Bewerben] [Details]                    │
├─────────────────────────────────────────┤
│ #124 | Hamburg → Frankfurt             │
│ 📅 26.11.2025 | 💰 €180.00             │
│ [Bewerben] [Details]                    │
└─────────────────────────────────────────┘
```

### **Admin - Bewerbungen ansehen:**
```
┌─────────────────────────────────────────┐
│ 🎯 Bewerbungen für Auftrag #123 (5)    │
├─────────────────────────────────────────┤
│ 1. Müller Transport GmbH               │
│    💰 €220.00 | Marge: €30.00          │
│    ⭐ 4.8 | ✅ Verifiziert             │
│    "Sofort verfügbar"                   │
│    [✓ Akzeptieren] [✗ Ablehnen]        │
├─────────────────────────────────────────┤
│ 2. Schmidt Logistik                    │
│    💰 €235.00 | Marge: €15.00          │
│    ⭐ 4.5 | ✅ Verifiziert             │
│    [✓ Akzeptieren] [✗ Ablehnen]        │
└─────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTIERUNGS-SCHRITTE

### **Phase 1: Backend (2-3 Tage)**
1. ✅ Datenbank-Tabelle erstellen
2. ✅ API-Endpoints implementieren
3. ✅ Validierung & Geschäftslogik
4. ✅ Email-Benachrichtigungen

### **Phase 2: Frontend (3-4 Tage)**
1. ✅ AvailableOrdersList Komponente
2. ✅ BidModal Komponente
3. ✅ MyBidsList Komponente
4. ✅ Admin OrderBidsModal
5. ✅ Integration in Dashboards

### **Phase 3: Testing (1-2 Tage)**
1. ✅ Unit Tests
2. ✅ Integration Tests
3. ✅ E2E Tests
4. ✅ User Acceptance Testing

### **Phase 4: Deployment (1 Tag)**
1. ✅ Migration ausführen
2. ✅ Feature-Flag aktivieren
3. ✅ Monitoring einrichten
4. ✅ Dokumentation

---

## 📈 METRIKEN & KPIs

### **Zu trackende Metriken:**
- Anzahl Bewerbungen pro Auftrag
- Durchschnittliche Antwortzeit
- Akzeptanzrate
- Durchschnittlicher Preis-Unterschied
- Vermittlungsgeschwindigkeit

---

## ⚙️ KONFIGURATION

### **Feature-Flags:**
```javascript
// .env
ENABLE_BIDS_SYSTEM=false  // true zum Aktivieren
MIN_BIDS_PER_ORDER=1      // Minimum Bewerbungen
MAX_BIDS_PER_ORDER=10     // Maximum Bewerbungen
BID_EXPIRY_HOURS=24       // Bewerbung läuft ab nach X Stunden
```

---

## 🔒 SICHERHEIT

### **Validierungen:**
- ✅ Nur verifizierte Contractor können bieten
- ✅ Preis-Validierung (>= Mindestlohn)
- ✅ Rate-Limiting (max. 10 Bewerbungen/Stunde)
- ✅ Spam-Schutz
- ✅ Duplicate-Check

---

## 📝 OFFENE FRAGEN

1. **Automatische Zuweisung?**
   - Soll der günstigste Bieter automatisch gewinnen?
   - Oder immer manuelle Admin-Entscheidung?

2. **Bewerbungs-Deadline?**
   - Wie lange können Fahrer sich bewerben?
   - Automatischer Abbruch nach X Stunden?

3. **Preis-Anpassung?**
   - Kann Admin den Preis nach Bewerbung noch ändern?
   - Verhandlungen möglich?

4. **Bewertungssystem?**
   - Sollen Bewerbungen bewertet werden?
   - Einfluss auf zukünftige Aufträge?

---

## 🎯 WANN IMPLEMENTIEREN?

### **JETZT implementieren, wenn:**
- ✅ Sie viele Auftragnehmer haben (>20)
- ✅ Sie Preise optimieren wollen
- ✅ Sie Verwaltungsaufwand reduzieren möchten
- ✅ Sie einen Marktplatz aufbauen wollen

### **SPÄTER implementieren, wenn:**
- ✅ Aktuelles System gut funktioniert
- ✅ Wenige Auftragnehmer (<10)
- ✅ Direkte Kontrolle wichtig ist
- ✅ Einfachheit Priorität hat

---

## 📞 KONTAKT

Bei Fragen zur Implementierung:
- Dokumentation: Diese Datei
- Code-Beispiele: Siehe `/examples/bids-system/`
- Support: Entwickler kontaktieren

---

**Status:** ⏳ Bereit für Implementierung  
**Priorität:** 🟡 Niedrig (Optional)  
**Aufwand:** ~7-10 Tage  
**Nutzen:** 🟢 Hoch (bei vielen Auftragnehmern)

---

**Erstellt:** 21.11.2025  
**Letzte Aktualisierung:** 21.11.2025
