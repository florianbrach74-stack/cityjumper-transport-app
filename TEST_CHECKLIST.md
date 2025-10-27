# Test-Checklist - Neue Features

## ✅ Bewerbungssystem
- [ ] Auftragnehmer kann sich auf Auftrag bewerben
- [ ] Preis-Validierung (max. 85% des Kundenpreises)
- [ ] Admin erhält Email bei neuer Bewerbung
- [ ] Admin sieht Bewerbungen im Dashboard
- [ ] Admin kann Bewerbung akzeptieren
- [ ] Admin kann Bewerbung ablehnen
- [ ] Auftragnehmer erhält Email bei Zusage
- [ ] Auftrag wird automatisch zugewiesen
- [ ] Preis wird auf Gebot gesetzt

## ✅ Status-Workflow
- [ ] Button "Als abgeholt markieren" funktioniert
- [ ] Email an Kunde bei Abholung
- [ ] Button "Zustellung abschließen" funktioniert
- [ ] Email an Kunde bei Zustellung
- [ ] CMR öffnet sich automatisch
- [ ] Status wird auf "completed" gesetzt nach Unterschrift
- [ ] Auftrag verschwindet aus "Aktive Aufträge"
- [ ] Auftrag erscheint in "Abgeschlossene Aufträge"

## ✅ CMR-Unterschriften
- [ ] Button "Absender-Unterschrift" im CMRViewer
- [ ] Name-Feld für Absender funktioniert
- [ ] Unterschrift wird gespeichert
- [ ] Button "Frachtführer-Unterschrift" im CMRViewer
- [ ] Name wird automatisch aus Account übernommen
- [ ] Feld ist disabled
- [ ] Unterschrift wird gespeichert
- [ ] Button "Empfänger-Unterschrift" im CMRViewer
- [ ] Name-Feld für Empfänger funktioniert
- [ ] Unterschrift wird gespeichert
- [ ] PDF zeigt alle 3 Unterschriften

## ✅ Verifizierungs-System
- [ ] Route /verification funktioniert
- [ ] Upload Transportversicherung (PDF)
- [ ] Upload Gewerbeanmeldung (PDF)
- [ ] Mindestlohngesetz-Erklärung anzeigen
- [ ] Unterschrift funktioniert
- [ ] Verifizierung einreichen
- [ ] Admin erhält Email
- [ ] Banner im ContractorDashboard (nicht verifiziert)
- [ ] Banner im ContractorDashboard (pending)
- [ ] Banner im ContractorDashboard (rejected)
- [ ] Sperre: Keine Bewerbung ohne Freigabe
- [ ] Admin-Tab "Verifizierungen" zeigt Auftragnehmer
- [ ] Dokumente sind anklickbar
- [ ] Button "Freigeben" funktioniert
- [ ] Button "Ablehnen" funktioniert
- [ ] Email an Auftragnehmer bei Freigabe
- [ ] Email an Auftragnehmer bei Ablehnung
- [ ] Nach Freigabe: Bewerbungen möglich

## 🔧 Bekannte Probleme
- Keine bekannten Probleme

## 📝 Notizen
- Alle Migrationen wurden ausgeführt
- Backend deployed auf Railway
- Frontend deployed auf Vercel
