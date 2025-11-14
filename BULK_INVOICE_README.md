# 📄 Sammelrechnung (Bulk Invoice) - Benutzerhandbuch

## 🎯 Übersicht

Die Sammelrechnung-Funktion ermöglicht es Admins, mehrere abgeschlossene Aufträge eines Kunden zu einer einzigen Rechnung zu kombinieren. Dies spart Zeit und reduziert den Verwaltungsaufwand.

## ✨ Features

- ✅ **Multi-Select**: Mehrere Aufträge gleichzeitig auswählen
- ✅ **Automatische Berechnung**: Zwischensumme + 19% MwSt.
- ✅ **PDF-Generierung**: Professionelle Rechnung mit Branding
- ✅ **Rechnungsnummer**: Auto-generiert (Format: `YYYY-NNNN`)
- ✅ **Fälligkeitsdatum**: Standard 14 Tage, anpassbar
- ✅ **Notizen**: Für Zahlungsbedingungen, Rabatte, etc.
- ⏳ **Email-Versand**: Temporär deaktiviert (wird nach 24h aktiviert)

## 📖 Anleitung

### Schritt 1: Aufträge auswählen

1. Gehen Sie zum **Admin Dashboard**
2. Klicken Sie auf den Tab **"Aufträge"**
3. Wählen Sie **abgeschlossene Aufträge** aus (Checkboxen)
   - Nur Aufträge mit Status "Abgeschlossen" können ausgewählt werden
   - Alle Aufträge müssen vom **gleichen Kunden** sein

**Tipp**: Nutzen Sie die "Alle auswählen"-Checkbox im Table-Header, um alle abgeschlossenen Aufträge auf einmal auszuwählen.

### Schritt 2: Sammelrechnung erstellen

1. Klicken Sie auf **"Sammelrechnung erstellen"** (erscheint, wenn Aufträge ausgewählt sind)
2. Das Modal öffnet sich mit einer **Vorschau**:
   - Kundeninformationen
   - Liste aller ausgewählten Aufträge
   - Zwischensumme, MwSt., Gesamtsumme

### Schritt 3: Details anpassen (optional)

**Fälligkeitsdatum**:
- Standard: 14 Tage ab heute
- Anpassbar über Datepicker

**Notizen**:
- Zahlungsbedingungen (z.B. "Zahlbar innerhalb 14 Tagen")
- Rabatte (z.B. "10% Mengenrabatt gewährt")
- Sonstige Hinweise

### Schritt 4: Rechnung erstellen

1. Klicken Sie auf **"Rechnung erstellen"**
2. Die Rechnung wird erstellt und die **PDF öffnet sich automatisch**
3. Sie können die PDF:
   - Herunterladen
   - Drucken
   - Manuell per Email verschicken

## 📋 Rechnung-Inhalt

Die generierte PDF-Rechnung enthält:

### Header
```
Courierly
Express Delivery Service

RECHNUNG 2025-0001
```

### Kundeninformationen
```
Rechnungsempfänger:
Max Mustermann GmbH
Musterstraße 123
12345 Berlin
```

### Rechnungsdetails
```
Rechnungsdatum: 14.11.2025
Fälligkeitsdatum: 28.11.2025
```

### Positionen
```
Pos. | Beschreibung                                    | Menge | Einzelpreis | Gesamt
-----|------------------------------------------------|-------|-------------|--------
1    | Auftrag #123 - Berlin → München (10.11.2025)  | 1     | 150,00 €    | 150,00 €
2    | Auftrag #124 - Hamburg → Frankfurt (11.11.2025)| 1     | 200,00 €    | 200,00 €
3    | Auftrag #125 - Köln → Stuttgart (12.11.2025)  | 1     | 180,00 €    | 180,00 €
```

### Totals
```
Zwischensumme:     530,00 €
MwSt. 19%:         100,70 €
─────────────────────────────
Gesamtsumme:       630,70 €
```

### Notizen (optional)
```
Anmerkungen:
Zahlbar innerhalb 14 Tagen ohne Abzug.
```

### Footer
```
Vielen Dank für Ihr Vertrauen! | Courierly GmbH | info@courierly.de
```

## 🔧 Technische Details

### Datenbank-Struktur

**Tabelle: `invoices`**
```sql
- id (Serial Primary Key)
- invoice_number (VARCHAR, unique) -- z.B. "2025-0001"
- customer_id (Integer, FK zu users)
- invoice_date (Date)
- due_date (Date)
- subtotal (Decimal)
- tax_rate (Decimal) -- Standard: 19.00
- tax_amount (Decimal)
- total_amount (Decimal)
- status (VARCHAR) -- draft, sent, paid, overdue, cancelled
- pdf_url (Text)
- notes (Text)
- created_by (Integer, FK zu users)
- created_at (Timestamp)
- updated_at (Timestamp)
- paid_at (Timestamp)
- sent_at (Timestamp)
```

**Tabelle: `invoice_items`**
```sql
- id (Serial Primary Key)
- invoice_id (Integer, FK zu invoices)
- order_id (Integer, FK zu orders)
- description (Text)
- quantity (Integer)
- unit_price (Decimal)
- total_price (Decimal)
- created_at (Timestamp)
```

**Verknüpfung**:
```sql
orders.invoice_id -> invoices.id
```

### API Endpoints

**POST `/api/invoices/bulk`**
- Erstellt Sammelrechnung
- Body: `{ orderIds: [1,2,3], customerId: 4, notes: "...", dueDate: "2025-11-28" }`
- Response: `{ success: true, invoice: {...} }`

**GET `/api/invoices`**
- Liste aller Rechnungen
- Query: `?page=1&limit=20&status=sent&customerId=4`

**GET `/api/invoices/:invoiceId`**
- Einzelne Rechnung mit Items

**GET `/api/invoices/:invoiceId/pdf`**
- PDF-Download

**POST `/api/invoices/:invoiceId/send`** ⏳
- Email-Versand (temporär deaktiviert)

**PATCH `/api/invoices/:invoiceId/status`**
- Status ändern (draft → sent → paid)

**DELETE `/api/invoices/:invoiceId`**
- Rechnung löschen

## ⚠️ Wichtige Hinweise

### Voraussetzungen
- ✅ Aufträge müssen Status **"Abgeschlossen"** haben
- ✅ Alle Aufträge müssen vom **gleichen Kunden** sein
- ✅ Aufträge dürfen **noch nicht abgerechnet** sein

### Einschränkungen
- ⏳ **Email-Versand** ist temporär deaktiviert (Railway Cache-Problem)
- ⚠️ Rechnungen können **nicht bearbeitet** werden (nur löschen und neu erstellen)
- ⚠️ Einmal abgerechnete Aufträge können **nicht erneut** abgerechnet werden

### Best Practices
- 📅 Erstellen Sie Rechnungen am **Monatsende**
- 📝 Fügen Sie **Zahlungsbedingungen** in den Notizen hinzu
- 💾 Speichern Sie PDFs **lokal** als Backup
- 📧 Verschicken Sie Rechnungen **zeitnah** per Email

## 🐛 Troubleshooting

### "Keine abgeschlossenen Aufträge gefunden"
**Lösung**: Stellen Sie sicher, dass die Aufträge Status "Abgeschlossen" haben.

### "Aufträge gehören nicht zum gleichen Kunden"
**Lösung**: Wählen Sie nur Aufträge eines Kunden aus.

### "Einige Aufträge wurden bereits abgerechnet"
**Lösung**: Entfernen Sie bereits abgerechnete Aufträge aus der Auswahl.

### PDF öffnet sich nicht
**Lösung**: 
1. Prüfen Sie, ob Pop-ups blockiert sind
2. Laden Sie die Seite neu (Cmd+Shift+R)
3. Versuchen Sie es mit einem anderen Browser

### Email-Versand funktioniert nicht
**Status**: Bekanntes Problem - Railway Cache
**Workaround**: PDF manuell herunterladen und per Email verschicken
**ETA**: Nach 24h (15. November 2025)

## 📊 Beispiel-Workflow

### Szenario: Monatliche Abrechnung für Stammkunden

1. **Monatsende**: 30. November 2025
2. **Aufträge**: Kunde "Max Mustermann GmbH" hat 15 Aufträge im November
3. **Vorgehen**:
   - Alle 15 Aufträge auf "Abgeschlossen" setzen
   - Im Admin Dashboard alle 15 Aufträge auswählen
   - Sammelrechnung erstellen mit:
     - Fälligkeitsdatum: 14. Dezember 2025
     - Notizen: "Monatliche Abrechnung November 2025. Zahlbar bis 14.12.2025."
   - PDF herunterladen
   - Per Email an kunde@example.com senden
4. **Ergebnis**: Eine Rechnung statt 15 einzelner Rechnungen ✅

## 🔮 Zukünftige Features

- 📧 **Automatischer Email-Versand** (nach Cache-Clear)
- 📊 **Rechnungs-Dashboard** (Übersicht aller Rechnungen)
- 💰 **Zahlungsstatus-Tracking** (Offen, Bezahlt, Überfällig)
- 🔔 **Mahnwesen** (Automatische Erinnerungen)
- 🔗 **Lexoffice-Integration** (Automatische Buchhaltung)
- 💳 **Zahlungs-Gateway** (Stripe/PayPal)
- 🔄 **Recurring Invoices** (Für Stammkunden)

## 📞 Support

Bei Fragen oder Problemen:
- 📧 Email: support@courierly.de
- 📱 Telefon: +49 (0)172 421...
- 🌐 Web: www.courierly.de

---

**Version**: 1.0
**Erstellt**: 14. November 2025
**Status**: ✅ Produktionsbereit (außer Email-Versand)
