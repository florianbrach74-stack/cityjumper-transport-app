# ZipMend Transport Management - Feature-Übersicht

## 🎯 Hauptfunktionen

### Für Auftraggeber (Kunden)

#### 1. Benutzer-Registrierung und Login
- ✅ Sichere Registrierung mit Email und Passwort
- ✅ JWT-basierte Authentifizierung
- ✅ Passwort-Hashing mit bcrypt
- ✅ Firmen- und Kontaktinformationen

#### 2. Auftragserstellung
- ✅ Detaillierte Abholinformationen (Adresse, Stadt, PLZ, Datum, Uhrzeit)
- ✅ Detaillierte Zustellinformationen
- ✅ Kontaktpersonen für Abholung und Zustellung
- ✅ Fahrzeugtyp-Auswahl:
  - Kleintransporter (bis 2 Paletten)
  - Mittlerer Transporter (bis 4 Paletten)
  - Großer Transporter (bis 8 Paletten)
  - Transporter mit Hebebühne
- ✅ Sendungsdetails (Gewicht, Maße, Paletten)
- ✅ Beschreibung und besondere Anforderungen
- ✅ Preisangabe

#### 3. Auftrags-Dashboard
- ✅ Übersicht aller erstellten Aufträge
- ✅ Status-Anzeige (Ausstehend, Angenommen, Unterwegs, Abgeschlossen)
- ✅ Statistiken (Gesamt, Ausstehend, Aktiv, Abgeschlossen)
- ✅ Detaillierte Auftragsansicht mit Route
- ✅ Auftragnehmer-Information bei angenommenen Aufträgen

#### 4. Email-Benachrichtigungen
- ✅ Bestätigung bei Auftragserstellung
- ✅ Benachrichtigung bei Auftragsannahme durch Auftragnehmer
- ✅ Professionelle HTML-Email-Templates

### Für Auftragnehmer (Subunternehmen/Mitarbeiter)

#### 1. Benutzer-Registrierung und Login
- ✅ Separate Registrierung als Auftragnehmer
- ✅ Firmen- und Kontaktinformationen
- ✅ Sichere Authentifizierung

#### 2. Verfügbare Aufträge
- ✅ Übersicht aller verfügbaren (noch nicht angenommenen) Aufträge
- ✅ Detaillierte Auftragsansicht:
  - Vollständige Abholadresse mit Kontaktdaten
  - Vollständige Zustelladresse mit Kontaktdaten
  - Abholdatum und -uhrzeit
  - Fahrzeugtyp und Sendungsdetails
  - Besondere Anforderungen
  - Preis
- ✅ Ein-Klick Auftragsannahme

#### 3. Meine Aufträge
- ✅ Übersicht aller angenommenen Aufträge
- ✅ Status-Verwaltung
- ✅ Kundeninformationen
- ✅ Alle relevanten Transport-Details

#### 4. Email-Benachrichtigungen
- ✅ Bestätigung bei Auftragsannahme
- ✅ Vollständige Auftragsdetails in der Email
- ✅ Kontaktinformationen für Abholung und Zustellung

## 🔒 Sicherheit

- ✅ JWT-Token-basierte Authentifizierung
- ✅ Passwort-Hashing mit bcrypt (10 Runden)
- ✅ Rollenbasierte Zugriffskontrolle (Customer/Contractor)
- ✅ Protected API Routes
- ✅ Input-Validierung mit express-validator
- ✅ SQL Injection Schutz durch parametrisierte Queries

## 💾 Datenbank

### Tabellen

#### Users
- Benutzer-Authentifizierung
- Rollen (Customer/Contractor)
- Kontakt- und Firmeninformationen
- Timestamps

#### Transport Orders
- Vollständige Abholinformationen
- Vollständige Zustellinformationen
- Sendungsdetails (Gewicht, Maße, Paletten)
- Fahrzeugtyp
- Status-Tracking
- Preis
- Verknüpfung zu Kunde und Auftragnehmer
- Timestamps (erstellt, aktualisiert, angenommen, abgeschlossen)

### Indizes
- Optimierte Queries für Kunden-Aufträge
- Optimierte Queries für Auftragnehmer-Aufträge
- Status-basierte Suche
- Email-Lookup

## 🎨 Benutzeroberfläche

### Design
- ✅ Moderne, responsive UI mit TailwindCSS
- ✅ Mobile-first Design
- ✅ Intuitive Navigation
- ✅ Lucide Icons für bessere UX
- ✅ Farbcodierte Status-Badges
- ✅ Loading-States und Feedback

### Komponenten
- ✅ Login/Register Formulare mit Validierung
- ✅ Dashboard mit Statistiken
- ✅ Auftrags-Tabellen und Karten
- ✅ Modal für Auftragserstellung
- ✅ Responsive Navbar
- ✅ Protected Routes

## 📧 Email-System

### Features
- ✅ Nodemailer Integration
- ✅ HTML Email Templates
- ✅ Automatische Benachrichtigungen
- ✅ Fehlerbehandlung (Emails blockieren nicht die Hauptfunktionalität)

### Email-Typen
1. **Auftrag erstellt** (an Kunde)
   - Auftragsbestätigung
   - Auftragsnummer
   - Zusammenfassung der Details

2. **Auftrag angenommen** (an Kunde)
   - Benachrichtigung über Annahme
   - Auftragnehmer-Information
   - Auftragsdetails

3. **Auftrag angenommen** (an Auftragnehmer)
   - Bestätigung der Annahme
   - Vollständige Auftragsdetails
   - Kontaktinformationen für Abholung/Zustellung

## 🔄 Workflow

### Auftragserstellung
1. Kunde meldet sich an
2. Kunde erstellt neuen Auftrag über Modal
3. Auftrag wird in Datenbank gespeichert (Status: pending)
4. Email-Benachrichtigung an Kunde
5. Auftrag erscheint in "Verfügbare Aufträge" für Auftragnehmer

### Auftragsannahme
1. Auftragnehmer sieht verfügbare Aufträge
2. Auftragnehmer prüft Details
3. Auftragnehmer nimmt Auftrag an
4. Status ändert sich zu "accepted"
5. Auftragnehmer-ID wird mit Auftrag verknüpft
6. Email an Kunde über Annahme
7. Email an Auftragnehmer mit vollständigen Details
8. Auftrag erscheint in "Meine Aufträge" des Auftragnehmers

## 🚀 Technologie-Stack

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **PostgreSQL** - Datenbank
- **JWT** - Authentifizierung
- **bcryptjs** - Passwort-Hashing
- **Nodemailer** - Email-Versand
- **express-validator** - Input-Validierung

### Frontend
- **React 18** - UI Framework
- **Vite** - Build Tool
- **React Router** - Navigation
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP Client

### Entwicklung
- **Nodemon** - Auto-Reload
- **Concurrently** - Parallel Scripts
- **ESLint** - Code Quality

## 📊 Status-Übersicht

### Auftragsstatus
- **pending** - Auftrag erstellt, wartet auf Annahme
- **accepted** - Auftrag von Auftragnehmer angenommen
- **in_transit** - Transport läuft
- **completed** - Transport abgeschlossen
- **cancelled** - Auftrag storniert

## 🔮 Erweiterungsmöglichkeiten

### Kurzfristig
- [ ] Echtzeit-Benachrichtigungen (WebSockets)
- [ ] Auftrags-Tracking mit GPS
- [ ] Dokumenten-Upload (Lieferscheine, Fotos)
- [ ] Bewertungssystem
- [ ] Rechnungserstellung

### Mittelfristig
- [ ] Mobile Apps (React Native)
- [ ] Automatische Routenoptimierung
- [ ] Preiskalkulator
- [ ] Multi-Language Support
- [ ] Dashboard-Analytics

### Langfristig
- [ ] KI-basierte Auftragsverteilung
- [ ] Integration mit Buchhaltungssoftware
- [ ] API für Drittanbieter
- [ ] White-Label-Lösung
- [ ] Blockchain für Transparenz
