# Migration Scripts

## Multi-Stop PDF Migration

### Problem
Alte Multi-Stop Aufträge (vor dem Fix) haben kein `pdf_url` in der Datenbank gespeichert. Dadurch zeigen die Accounts nur einzelne CMRs statt das kombinierte PDF.

### Lösung
Das Script `migrate-multistop-pdfs.js` findet alle abgeschlossenen Multi-Stop Aufträge und:
1. Generiert das kombinierte PDF
2. Speichert den Pfad in der Datenbank
3. Aktualisiert ALLE CMRs der Gruppe

### Verwendung

#### Lokal testen:
```bash
cd /Users/florianbrach/Desktop/Zipemendapp/CascadeProjects/windsurf-project
node server/scripts/migrate-multistop-pdfs.js
```

#### Auf Railway ausführen:

**Option 1: Über Railway CLI**
```bash
railway run node server/scripts/migrate-multistop-pdfs.js
```

**Option 2: Temporär in package.json**
```json
{
  "scripts": {
    "migrate:pdfs": "node server/scripts/migrate-multistop-pdfs.js"
  }
}
```

Dann auf Railway:
```bash
npm run migrate:pdfs
```

**Option 3: Einmalig über Railway Shell**
1. Gehe zu Railway Dashboard
2. Öffne die Shell für dein Backend
3. Führe aus: `node server/scripts/migrate-multistop-pdfs.js`

### Was passiert:

```
🚀 Starting Multi-Stop PDF Migration...

📊 Found 3 completed multi-stop orders

📦 Processing Order 89 (Group 1)
   Total CMRs: 2, Completed: 2
   🔄 Generating combined PDF...
   ✅ Combined PDF generated: CMR_MultiStop_Auftrag_89.pdf
   💾 Updated 2 CMRs with pdf_url: /uploads/cmr/CMR_MultiStop_Auftrag_89.pdf
      - CMR CMR2500259 (ID: 259)
      - CMR CMR2500262 (ID: 262)
   ✅ Order 89 migrated successfully

...

============================================================
📊 Migration Summary:
   Total orders: 3
   ✅ Successful: 3
   ❌ Failed: 0
============================================================

🎉 Migration completed! All completed multi-stop orders now have combined PDFs.
```

### Sicherheit

- Das Script ist **idempotent** - kann mehrfach ausgeführt werden ohne Probleme
- Es überschreibt bestehende `pdf_url` Werte
- Es ändert KEINE Unterschriften oder andere Daten
- Es generiert nur PDFs für **vollständig abgeschlossene** Multi-Stop Aufträge

### Nach der Migration

Alle alten Multi-Stop Aufträge zeigen jetzt in den Accounts das kombinierte PDF:
- ✅ Kunde sieht kombiniertes PDF
- ✅ Auftragnehmer sieht kombiniertes PDF
- ✅ Admin sieht kombiniertes PDF
- ✅ Dasselbe PDF wie in der Email

### Troubleshooting

**Fehler: "Cannot find module '../config/database'"**
→ Stelle sicher, dass du im Root-Verzeichnis des Projekts bist

**Fehler: "Connection timeout"**
→ Prüfe die DATABASE_URL Environment Variable

**Fehler: "PDF generation failed"**
→ Prüfe ob die Order und CMR Daten vollständig sind
→ Prüfe die Logs für Details

### Rollback

Falls etwas schief geht, kannst du die `pdf_url` Felder zurücksetzen:

```sql
UPDATE cmr_documents 
SET pdf_url = NULL 
WHERE cmr_group_id IS NOT NULL;
```

Dann das Script erneut ausführen.
