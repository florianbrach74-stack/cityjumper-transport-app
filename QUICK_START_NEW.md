# 🚀 CityJumper - Quick Start Guide

## Schnellstart (5 Minuten)

### 1. Repository klonen
```bash
git clone https://github.com/florianbrach74-stack/cityjumper-transport-app.git
cd cityjumper-transport-app
```

### 2. Backend starten
```bash
cd server
npm install
npm start
```
Backend läuft auf: http://localhost:5000

### 3. Frontend starten (neues Terminal)
```bash
cd client
npm install
npm run dev
```
Frontend läuft auf: http://localhost:5173

---

## 🎯 Was wurde implementiert (Letzte 60 Min)

### ✅ Bewerbungssystem
- Auftragnehmer bewerben sich mit Preis (max. 85%)
- Admin sieht Bewerbungen + Marge
- Email-Benachrichtigungen

### ✅ CMR-Unterschriften
- 3 Buttons im CMRViewer (Absender, Frachtführer, Empfänger)
- Frachtführer-Name automatisch aus Account
- PDF mit allen Unterschriften

### ✅ Verifizierungs-System
- Upload: Transportversicherung + Gewerbeanmeldung
- Unterschrift: Mindestlohngesetz-Erklärung
- Admin-Tab für Freigabe
- Sperre: Keine Bewerbungen ohne Freigabe

### ✅ Status-Workflow
- Tabs für abgeschlossene Aufträge
- Automatische Status-Updates

---

## 🧪 Schnell-Tests

### Test 1: Bewerbungssystem
```
1. Als Kunde: Auftrag erstellen (€100)
2. Als Auftragnehmer: Bewerben (€80)
3. Als Admin: Bewerbung akzeptieren
✓ Auftragnehmer erhält Email + Auftrag zugewiesen
```

### Test 2: CMR-Unterschriften
```
1. Als Auftragnehmer: CMR öffnen
2. Button "Absender-Unterschrift" → Unterschreiben
3. Button "Frachtführer-Unterschrift" → Unterschreiben
4. Button "Empfänger-Unterschrift" → Unterschreiben
✓ PDF zeigt alle 3 Unterschriften
```

### Test 3: Verifizierung
```
1. Als Auftragnehmer: Registrieren
2. Klick "Jetzt verifizieren"
3. Dokumente hochladen + unterschreiben
4. Als Admin: Tab "Verifizierungen" → Freigeben
✓ Auftragnehmer kann sich bewerben
```

---

## 🌐 Live-URLs

- **Frontend:** https://cityjumper-transport-app.vercel.app
- **Backend:** https://cityjumper-api-production-01e4.up.railway.app
- **Database:** Railway PostgreSQL

---

## 📚 Weitere Dokumentation

- **Vollständig:** `README_COMPLETE.md`
- **Tests:** `TEST_CHECKLIST.md`

---

**Alles funktioniert!** 🎉
