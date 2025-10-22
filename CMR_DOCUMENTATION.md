# 📄 CMR Frachtbrief System - Dokumentation

## Übersicht

Das CMR-System wurde vollständig in die Transport-Management-Plattform integriert. Es erstellt automatisch internationale Frachtbriefe (CMR) bei Auftragsannahme und ermöglicht digitale Unterschriften auf mobilen Geräten.

## ✨ Hauptfunktionen

### 1. Automatische CMR-Erstellung
- ✅ **Automatisch bei Auftragsannahme**: Sobald ein Auftragnehmer einen Auftrag annimmt, wird automatisch ein CMR-Dokument erstellt
- ✅ **Eindeutige CMR-Nummer**: Format `CMR{Jahr}{Laufnummer}` (z.B. CMR25000001)
- ✅ **PDF-Generierung**: Professionelles CMR-PDF nach internationalem Standard
- ✅ **QR-Code**: Jedes CMR enthält einen QR-Code für schnellen Zugriff

### 2. Digitale Unterschriften
- ✅ **Drei Unterschriftsfelder**:
  - Absender (Sender)
  - Frachtführer (Carrier)
  - Empfänger (Consignee)
- ✅ **Mobile-optimiert**: Touch-basierte Unterschrift auf Smartphones/Tablets
- ✅ **Geolocation**: Automatische Erfassung des Standorts bei Unterschrift
- ✅ **Zeitstempel**: Genaue Dokumentation von Datum und Uhrzeit
- ✅ **Bemerkungen**: Empfänger kann Bemerkungen hinzufügen (z.B. Schäden)

### 3. Mobile Unterschrifts-Seite
- ✅ **Öffentlicher Zugang**: Keine Anmeldung erforderlich
- ✅ **Eindeutiger Link**: `/cmr/{CMR-Nummer}`
- ✅ **Responsive Design**: Optimiert für alle Bildschirmgrößen
- ✅ **Einfache Bedienung**: Intuitive Touch-Oberfläche

### 4. Email-Benachrichtigungen
- ✅ **Bei Zustellung**: Kunde und Auftragnehmer erhalten Email
- ✅ **CMR-Details**: Vollständige Informationen in der Email
- ✅ **Status-Update**: Auftrag wird automatisch auf "completed" gesetzt

## 🔄 Workflow

### Schritt 1: Auftragserstellung (Kunde)
```
Kunde erstellt Auftrag
    ↓
Auftrag wird in Datenbank gespeichert (Status: pending)
    ↓
Email-Benachrichtigung an Kunde
```

### Schritt 2: Auftragsannahme (Auftragnehmer)
```
Auftragnehmer nimmt Auftrag an
    ↓
Auftrag-Status: pending → accepted
    ↓
CMR-Dokument wird automatisch erstellt
    ├─ Absender-Daten (aus Pickup-Informationen)
    ├─ Empfänger-Daten (aus Delivery-Informationen)
    ├─ Frachtführer-Daten (Auftragnehmer)
    ├─ Sendungsdetails (Gewicht, Paletten, etc.)
    └─ CMR-Nummer generiert
    ↓
PDF wird generiert und gespeichert
    ↓
Email-Benachrichtigungen an Kunde und Auftragnehmer
```

### Schritt 3: Transport und Zustellung
```
Auftragnehmer transportiert Sendung
    ↓
Bei Zustellung: Auftragnehmer sendet Link an Empfänger
    ↓
Empfänger öffnet Link auf Smartphone
    ↓
Empfänger unterschreibt digital
    ├─ Standort wird erfasst
    ├─ Zeitstempel wird gesetzt
    └─ Optional: Bemerkungen hinzufügen
    ↓
CMR-Status: in_transit → signed
Auftrag-Status: accepted → completed
    ↓
PDF wird mit Unterschrift aktualisiert
    ↓
Email-Benachrichtigungen an Kunde und Auftragnehmer
```

## 📱 Mobile Unterschrift - Benutzerführung

### Für Auftragnehmer:
1. Öffnen Sie das CMR-Dokument im Dashboard
2. Klicken Sie auf "Link kopieren"
3. Senden Sie den Link per WhatsApp/SMS/Email an den Empfänger

### Für Empfänger:
1. Öffnen Sie den erhaltenen Link auf Ihrem Smartphone
2. Überprüfen Sie die Sendungsdetails
3. Geben Sie optional Bemerkungen ein
4. Klicken Sie auf "Jetzt unterschreiben"
5. Unterschreiben Sie mit dem Finger auf dem Bildschirm
6. Klicken Sie auf "Bestätigen"
7. Fertig! Bestätigung wird angezeigt

## 🗄️ Datenbank-Schema

### CMR Documents Tabelle

```sql
cmr_documents
├── id (Primary Key)
├── order_id (Foreign Key → transport_orders)
├── cmr_number (Unique)
│
├── Sender Information
│   ├── sender_name
│   ├── sender_address
│   ├── sender_city
│   ├── sender_postal_code
│   └── sender_country
│
├── Consignee Information
│   ├── consignee_name
│   ├── consignee_address
│   ├── consignee_city
│   ├── consignee_postal_code
│   └── consignee_country
│
├── Carrier Information
│   ├── carrier_name
│   ├── carrier_address
│   ├── carrier_city
│   └── carrier_postal_code
│
├── Shipment Details
│   ├── place_of_loading
│   ├── place_of_delivery
│   ├── documents_attached
│   ├── goods_description
│   ├── number_of_packages
│   ├── method_of_packing
│   ├── marks_and_numbers
│   ├── gross_weight
│   ├── volume
│   └── special_agreements
│
├── Signatures
│   ├── sender_signature (Base64 Image)
│   ├── sender_signed_at
│   ├── sender_signature_location
│   ├── carrier_signature (Base64 Image)
│   ├── carrier_signed_at
│   ├── carrier_signature_location
│   ├── consignee_signature (Base64 Image)
│   ├── consignee_signed_at
│   ├── consignee_signature_location
│   └── consignee_remarks
│
├── Status & Metadata
│   ├── status (created/in_transit/delivered/signed)
│   ├── pdf_url
│   ├── created_at
│   ├── updated_at
│   └── delivered_at
```

## 🔌 API Endpoints

### CMR Management

```bash
# Eigene CMRs abrufen (authentifiziert)
GET /api/cmr/my-cmrs
Authorization: Bearer {token}

# CMR für einen Auftrag abrufen (authentifiziert)
GET /api/cmr/order/:orderId
Authorization: Bearer {token}

# CMR per CMR-Nummer abrufen (öffentlich für Unterschrift)
GET /api/cmr/:cmrNumber

# Unterschrift hinzufügen
POST /api/cmr/:cmrId/signature
{
  "signatureType": "consignee",
  "signatureData": "data:image/png;base64,...",
  "location": "48.1351,11.5820",
  "remarks": "Sendung in gutem Zustand erhalten"
}
```

## 📄 CMR-PDF Inhalt

Das generierte PDF enthält alle Felder eines internationalen CMR-Frachtbriefs:

### Hauptfelder:
1. **Absender** (Box 1)
2. **Empfänger** (Box 2)
3. **Auslieferungsort** (Box 3)
4. **Ort und Tag der Übernahme** (Box 4)
5. **Beigefügte Dokumente** (Box 5)
6. **Frachtführer** (Box 16)
7. **Nachfolgende Frachtführer** (Box 17)
8. **Vorbehalte und Bemerkungen** (Box 18)
9. **Besondere Vereinbarungen** (Box 19)
10. **Zu zahlen** (Box 20)
11. **Unterschriften** (Box 22, 23, 24)

### Zusätzliche Features:
- CMR-Nummer prominent angezeigt
- QR-Code für schnellen Zugriff
- Datum der Erstellung
- Tabelle mit Sendungsdetails
- Unterschriftsstatus-Anzeige

## 🎨 Frontend-Komponenten

### 1. CMRViewer Component
**Datei**: `client/src/components/CMRViewer.jsx`

**Features**:
- Vollständige CMR-Anzeige in Modal
- Status-Badges für Unterschriften
- PDF-Download-Button
- Link zum Teilen für Empfänger-Unterschrift
- Responsive Design

**Verwendung**:
```jsx
<CMRViewer 
  orderId={orderId} 
  onClose={() => setShowModal(false)} 
/>
```

### 2. SignaturePad Component
**Datei**: `client/src/components/SignaturePad.jsx`

**Features**:
- Touch-optimiertes Canvas
- Maus- und Touch-Unterstützung
- Löschen-Funktion
- Responsive Größenanpassung
- Base64-Export der Unterschrift

**Verwendung**:
```jsx
<SignaturePad 
  onSave={(signatureData) => handleSignature(signatureData)}
  onCancel={() => setShowPad(false)}
/>
```

### 3. CMRSignature Page
**Datei**: `client/src/pages/CMRSignature.jsx`

**Features**:
- Öffentliche Seite (keine Authentifizierung)
- CMR-Details-Anzeige
- Standort-Erfassung
- Bemerkungsfeld
- Erfolgs-Bestätigung
- Mobile-optimiert

**Route**: `/cmr/:cmrNumber`

## 🔧 Installation & Setup

### 1. Datenbank-Schema aktualisieren

```bash
# CMR-Schema zur Datenbank hinzufügen
psql zipmend_db < server/database/cmr_schema.sql
```

### 2. Dependencies installieren

Die neuen Dependencies wurden bereits zur `package.json` hinzugefügt:
- `pdfkit` - PDF-Generierung
- `qrcode` - QR-Code-Generierung

```bash
npm install
```

### 3. Uploads-Verzeichnis erstellen

Das System erstellt automatisch das Verzeichnis `uploads/cmr/` für PDF-Speicherung.

### 4. Umgebungsvariablen (optional)

```env
# Optional: Firmen-Telefonnummer für CMR-Footer
COMPANY_PHONE=+49 123 456789
```

## 📧 Email-Templates

### Bei Zustellung (an Kunde)
```
Betreff: ✅ Lieferung bestätigt - CMR unterschrieben

Ihr Transportauftrag wurde erfolgreich zugestellt und vom 
Empfänger unterschrieben.

CMR-Details:
- CMR-Nummer: CMR25000001
- Zugestellt am: 22.10.2025, 14:30
- Ort: München
- Bemerkungen: Sendung in gutem Zustand erhalten

Das unterschriebene CMR-Dokument steht in Ihrem Dashboard 
zum Download bereit.
```

### Bei Zustellung (an Auftragnehmer)
```
Betreff: ✅ Lieferung bestätigt - CMR unterschrieben

Der Transportauftrag wurde erfolgreich zugestellt und vom 
Empfänger unterschrieben.

CMR-Details:
- CMR-Nummer: CMR25000001
- Zugestellt am: 22.10.2025, 14:30
- Ort: München

Das unterschriebene CMR-Dokument steht in Ihrem Dashboard 
zum Download bereit.
```

## 🔒 Sicherheit

### Authentifizierung
- **Dashboard-Zugriff**: JWT-Token erforderlich
- **CMR-Anzeige**: Nur für Kunde und Auftragnehmer des Auftrags
- **Unterschrifts-Seite**: Öffentlich zugänglich (nur mit CMR-Nummer)

### Datenvalidierung
- Unterschrift-Typ wird validiert
- CMR-Nummer wird geprüft
- Nur ausstehende Unterschriften können hinzugefügt werden

### Datenschutz
- Standortdaten werden nur bei Zustimmung erfasst
- Unterschriften werden als Base64-Bilder gespeichert
- Alle Zeitstempel in UTC

## 📊 Status-Übersicht

### CMR-Status
- **created**: CMR erstellt, keine Unterschriften
- **in_transit**: Frachtführer hat unterschrieben
- **delivered**: Zugestellt, wartet auf Empfänger-Unterschrift
- **signed**: Vollständig unterschrieben

### Auftrag-Status-Synchronisation
- Bei Empfänger-Unterschrift: Auftrag → `completed`
- CMR-Status wird automatisch aktualisiert

## 🎯 Best Practices

### Für Auftragnehmer:
1. **Bei Abholung**: Optional Absender-Unterschrift einholen
2. **Vor Transport**: Frachtführer-Unterschrift hinzufügen
3. **Bei Zustellung**: Link an Empfänger senden
4. **Nach Unterschrift**: PDF herunterladen und archivieren

### Für Kunden:
1. **Nach Auftragsannahme**: CMR-Dokument prüfen
2. **Bei Zustellung**: Email-Benachrichtigung abwarten
3. **PDF archivieren**: Für Buchhaltung und Dokumentation

## 🐛 Troubleshooting

### CMR wird nicht erstellt
**Problem**: Kein CMR nach Auftragsannahme
**Lösung**: 
- Prüfen Sie die Server-Logs
- Stellen Sie sicher, dass das CMR-Schema importiert wurde
- Prüfen Sie, ob das uploads-Verzeichnis beschreibbar ist

### PDF-Generierung schlägt fehl
**Problem**: Fehler bei PDF-Erstellung
**Lösung**:
- Prüfen Sie, ob pdfkit installiert ist: `npm list pdfkit`
- Stellen Sie sicher, dass Schreibrechte für `uploads/cmr/` existieren

### Unterschrift wird nicht gespeichert
**Problem**: Unterschrift verschwindet nach Speichern
**Lösung**:
- Prüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass die CMR-ID korrekt ist
- Prüfen Sie die Netzwerk-Anfragen

### Mobile Unterschrift funktioniert nicht
**Problem**: Touch-Eingabe wird nicht erkannt
**Lösung**:
- Stellen Sie sicher, dass `touch-action: none` im CSS gesetzt ist
- Prüfen Sie, ob der Browser Touch-Events unterstützt
- Testen Sie in verschiedenen Browsern

## 📱 Mobile Optimierung

### Touch-Gesten
- **Zeichnen**: Ein Finger
- **Scrollen**: Zwei Finger (außerhalb des Canvas)
- **Zoom**: Pinch (außerhalb des Canvas)

### Responsive Breakpoints
- **Mobile**: < 768px - Volle Breite
- **Tablet**: 768px - 1024px - Optimierte Ansicht
- **Desktop**: > 1024px - Maximale Breite 1200px

## 🚀 Zukünftige Erweiterungen

### Geplante Features:
- [ ] Foto-Upload bei Zustellung
- [ ] Mehrere CMR-Kopien (für verschiedene Parteien)
- [ ] Automatische Email mit CMR-PDF als Anhang
- [ ] CMR-Vorlagen für wiederkehrende Routen
- [ ] Barcode-Scanner für CMR-Nummer
- [ ] Offline-Modus für Unterschriften
- [ ] Multi-Language Support für CMR
- [ ] Integration mit Buchhaltungssoftware

---

**Entwickelt für effiziente und rechtssichere Transportdokumentation** 📄✅
