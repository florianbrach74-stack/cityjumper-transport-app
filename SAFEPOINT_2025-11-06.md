# 🎯 Safepoint - 09. November 2025

## Courierly - Projekt-Status: Produktionsbereit ✅

### Rebranding zu Courierly ✨
- Neues Logo: Package mit Speed-Arrow (Cyan + Orange)
- Alle Texte von CityJumper → Courierly umbenannt
- Neues Farbschema: Cyan (#00d9ff) + Orange (#ffa500)
- "Express Delivery" statt "Express Transport"

### Letzte große Updates (Session vom 06.11.2025)

---

## 🆕 Neue Features

### 1. **Dynamische Preiskalkulation (Admin-gesteuert)**
- ✅ Admin kann alle Preisparameter ohne Code-Änderungen anpassen
- ✅ Distanzpreise (unter/über 100km)
- ✅ Stundensatz, Startgebühr, Extra-Stop-Gebühr
- ✅ Plattform-Provision (Standard: 15%)
- ✅ Wartezeit-Parameter
- ✅ Live-Updates für neue Aufträge
- **Route:** `/admin` → Tab "💰 Preiskalkulation"

### 2. **Reporting & Abrechnungs-System**
- ✅ Zeitraum-Filter (7/14/30 Tage, Custom)
- ✅ Zusammenfassungen für Kunden/Auftragnehmer/Admin
- ✅ CSV-Export
- ✅ Sammelrechnungen (Admin)
- ✅ Einzelrechnungen pro Auftrag
- ✅ Kunden-Filter (Admin)
- **Route:** Alle Dashboards → Tab "📊 Abrechnungen"

### 3. **Professionelle Rechnungen mit Vorschau**
- ✅ Vollständiger Rechnungskopf (Firmenadresse, USt-IdNr)
- ✅ Editierbare Rechnungsnummer
- ✅ Editierbares Rechnungsdatum
- ✅ MwSt-Berechnung (19%)
- ✅ Kleinunternehmer-Option (§19 UStG)
- ✅ Zahlungsinformationen (IBAN, BIC)
- ✅ PDF-Style Vorschau vor Versand

### 4. **AGB & Widerrufsbelehrung**
- ✅ Vollständige AGB-Seite (`/agb`)
- ✅ Widerrufsbelehrung für Verbraucher (`/widerruf`)
- ✅ Footer mit Links zu allen rechtlichen Dokumenten
- ✅ Muster-Widerrufsformular
- ✅ Verbraucherpflichten dokumentiert

### 5. **Widerrufsrecht-Zustimmung (Privatkunden)**
- ✅ Checkbox bei Auftragserteilung
- ✅ Nur für Privatkunden (keine Firma)
- ✅ Aktive Zustimmung erforderlich
- ✅ Link zur Widerrufsbelehrung
- ✅ Consent-Tracking in DB (IP, Timestamp)
- ✅ § 356 Abs. 4 BGB konform

### 6. **Umfassendes Stornierungssystem**

#### Kunden-Stornierung (Automatisch nach AGB):
- ✅ >24h vor Abholung: 0% (Kostenlos)
- ✅ <24h vor Abholung: 50% Gebühr
- ✅ Fahrer unterwegs: 75% Gebühr
- ✅ Automatische Berechnung
- ✅ Fahrer kann bei 75% Auftrag abschließen
- ✅ Preis wird auf 75% reduziert

#### Auftragnehmer-Stornierung (Admin-gesteuert):
- ✅ AGB-Gebühren gelten (50% oder 75%)
- ✅ Admin kann Preis erhöhen (max. = Stornogebühr)
- ✅ Auftrag wird auf 'pending' gesetzt
- ✅ Verfügbar für neue Auftragnehmer
- ✅ Auftragnehmer zahlt Strafe

#### Features:
- ✅ Vorschau vor Stornierung
- ✅ Audit-Trail (cancellation_history)
- ✅ Admin-Notizen
- ✅ Automatische Preisanpassungen
- ✅ Intelligente Status-Verwaltung

---

## 📊 Datenbank-Schema Updates

### Neue Tabellen:
1. **pricing_settings** - Dynamische Preisparameter
2. **cancellation_history** - Audit-Trail für Stornierungen

### Erweiterte Tabellen (transport_orders):
```sql
-- Pricing
minimum_price_at_creation DECIMAL(10,2)
price_updated_at TIMESTAMP

-- Withdrawal Consent
withdrawal_consent_given BOOLEAN
withdrawal_consent_timestamp TIMESTAMP
withdrawal_consent_ip VARCHAR(45)

-- Cancellation
cancellation_status VARCHAR(50)
cancelled_by VARCHAR(20)
cancellation_reason TEXT
cancellation_timestamp TIMESTAMP
cancellation_fee DECIMAL(10,2)
cancellation_fee_percentage INTEGER
contractor_penalty DECIMAL(10,2)
customer_compensation DECIMAL(10,2)
cancellation_notes TEXT
```

---

## 🔌 API Endpoints (Neu)

### Pricing:
- `GET /api/pricing/settings` - Alle Einstellungen
- `PUT /api/pricing/settings/:key` - Einstellung aktualisieren
- `POST /api/pricing/settings/reset` - Auf Standard zurücksetzen

### Reports:
- `GET /api/reports/summary` - Zusammenfassung mit Filter
- `GET /api/reports/by-customer` - Nach Kunde gruppiert (Admin)
- `POST /api/reports/bulk-invoice` - Sammelrechnung

### Cancellation:
- `POST /api/cancellation/:id/cancel-by-customer` - Kunden-Stornierung
- `POST /api/cancellation/:id/cancel-by-contractor` - Auftragnehmer-Stornierung (Admin)
- `GET /api/cancellation/:id/cancellation-preview` - Vorschau
- `GET /api/cancellation/:id/history` - Historie (Admin)

---

## 🎨 UI-Komponenten (Neu)

1. **PricingSettings.jsx** - Preiskalkulation-Verwaltung
2. **ReportsSummary.jsx** - Abrechnungs-Übersicht
3. **InvoicePreviewModal.jsx** - Rechnungsvorschau
4. **CancellationModal.jsx** - Stornierungsverwaltung
5. **Footer.jsx** - Website-Footer mit Links
6. **AGB.jsx** - AGB-Seite
7. **Widerruf.jsx** - Widerrufsbelehrung

---

## 📁 Wichtige Dateien

### Dokumentation:
- `PRICING_DOCUMENTATION.md` - Preiskalkulation erklärt
- `CMR_DOCUMENTATION.md` - CMR-System
- `ADMIN_EDIT_FEATURES.md` - Admin-Funktionen
- `WITHDRAWAL_MIGRATION_INSTRUCTIONS.md` - Widerrufsrecht-Migration

### Migrations:
- `add_pricing_settings.sql` + `run_pricing_settings_migration.js`
- `add_withdrawal_consent.sql` + `run_withdrawal_consent_migration.js`
- `add_cancellation_system.sql` + `run_cancellation_migration.js`

### Backend:
- `server/routes/pricing.js`
- `server/routes/reports.js`
- `server/routes/cancellation.js`

### Frontend:
- `client/src/components/` - Alle neuen Komponenten
- `client/src/pages/AGB.jsx`
- `client/src/pages/Widerruf.jsx`

---

## ✅ Rechtliche Compliance

### Implementiert:
- ✅ § 355 BGB - Widerrufsrecht
- ✅ § 356 Abs. 4 BGB - Erlöschen des Widerrufsrechts
- ✅ § 312g BGB - Fernabsatzverträge
- ✅ § 19 UStG - Kleinunternehmerregelung
- ✅ DSGVO - Consent-Tracking
- ✅ AGB - Vollständig dokumentiert
- ✅ Widerrufsbelehrung - Verbraucherkonform

---

## 🚀 Deployment-Status

### Produktiv:
- ✅ Frontend: Vercel
- ✅ Backend: Railway
- ✅ Datenbank: Railway PostgreSQL
- ✅ Alle Migrationen ausgeführt

### Letzte Deployments:
- Pricing System: ✅
- Reporting System: ✅
- Invoice Preview: ✅
- AGB/Widerruf: ✅
- Withdrawal Consent: ✅
- Cancellation System: ✅

---

## 📈 Nächste Schritte (Optional)

### Potenzielle Erweiterungen:
1. Email-Versand für Rechnungen
2. PDF-Generierung (Server-seitig)
3. Automatische Zahlungserinnerungen
4. Statistik-Dashboard
5. Export-Funktionen (Excel, PDF)
6. Benachrichtigungssystem
7. Stornieren-Button im Admin-Dashboard

---

## 🔧 Technologie-Stack

### Frontend:
- React 18
- React Router
- Axios
- TailwindCSS
- Lucide Icons
- Vite

### Backend:
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Bcrypt
- CORS

### Deployment:
- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL

---

## 👥 Rollen & Berechtigungen

### Admin:
- Alle Funktionen
- Preiskalkulation verwalten
- Sammelrechnungen erstellen
- Stornierungen verwalten
- Alle Reports sehen

### Kunde:
- Aufträge erstellen
- Eigene Aufträge sehen
- Preise erhöhen
- Eigene Abrechnungen
- Widerrufsrecht (Privatkunden)

### Auftragnehmer:
- Verfügbare Aufträge sehen
- Aufträge annehmen
- Status aktualisieren
- Eigene Abrechnungen
- CMR verwalten

---

## 📞 Support & Kontakt

**FB Transporte – Inhaber Florian Brach**
- Adresse: Adolf-Menzel-Straße 71, 12621 Berlin
- Telefon: 0172 421 6672
- Email: info@florianbrach.com
- Website: www.florianbrach.com

---

## 📝 Changelog

### Version 2.0 (06.11.2025)
- ✅ Dynamische Preiskalkulation
- ✅ Reporting & Abrechnungen
- ✅ Professionelle Rechnungen
- ✅ AGB & Widerrufsbelehrung
- ✅ Widerrufsrecht-Zustimmung
- ✅ Stornierungssystem

### Version 1.0 (Vorherige Features)
- ✅ Auftrags-Management
- ✅ CMR-System
- ✅ Wartezeit-Verwaltung
- ✅ Beiladungs-Option
- ✅ Multi-Stop-Aufträge
- ✅ Benutzer-Verwaltung

---

**Status:** ✅ Produktionsbereit
**Datum:** 06. November 2025
**Version:** 2.0
