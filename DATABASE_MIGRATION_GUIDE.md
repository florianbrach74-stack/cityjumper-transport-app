# 🗄️ Datenbank-Migration Guide für Railway

## 📋 ÜBERSICHT

Diese Anleitung beschreibt die **sichere Methode** zur Erstellung neuer Datenbank-Tabellen auf Railway.app, ohne die Produktion zu gefährden.

---

## ⚠️ WARUM DIESE METHODE?

**Problem mit automatischen Migrationen:**
- Automatische Migrationen können fehlschlagen
- SSL/TLS-Verbindungsprobleme
- IPv6/IPv4-Probleme
- Keine direkte Kontrolle über Timing

**Lösung: API-basierte Migration:**
- ✅ Volle Kontrolle über Ausführung
- ✅ Keine SSL-Probleme (nutzt interne Railway-Verbindung)
- ✅ Kann jederzeit ausgeführt werden
- ✅ Einfach zu testen und zu verifizieren

---

## 🚀 SCHRITT-FÜR-SCHRITT ANLEITUNG

### **Schritt 1: Migration-Endpunkt erstellen**

Erstellen Sie eine neue Datei: `server/routes/create-[table-name].js`

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Create [table_name] table (one-time use)
router.post('/create-[table-name]', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating [table_name] table...');
    
    await client.query('BEGIN');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS [table_name] (
        id SERIAL PRIMARY KEY,
        -- Ihre Spalten hier
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_[table_name]_[column] 
      ON [table_name]([column]);
    `);
    console.log('✅ Indexes created');
    
    await client.query('COMMIT');
    
    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = '[table_name]'
    `);
    
    const columnCount = parseInt(result.rows[0].column_count);
    
    res.json({
      success: true,
      message: '[table_name] table created successfully!',
      columnCount,
      expectedColumns: [EXPECTED_NUMBER]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating table:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
```

### **Schritt 2: Route in server/index.js registrieren**

```javascript
app.use('/api', require('./routes/create-[table-name]'));
```

### **Schritt 3: Code committen und deployen**

```bash
git add -A
git commit -m "feat: Add migration endpoint for [table_name]"
git push
railway up --detach
```

### **Schritt 4: Warten auf Deployment**

Warten Sie 60-90 Sekunden bis das Deployment abgeschlossen ist.

### **Schritt 5: Migration ausführen**

```bash
curl -X POST https://[YOUR-RAILWAY-URL]/api/create-[table-name]
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "message": "[table_name] table created successfully!",
  "columnCount": 12,
  "expectedColumns": 12,
  "allGood": true
}
```

### **Schritt 6: Verifizierung**

1. Gehen Sie zum Railway Dashboard
2. Öffnen Sie die Postgres-Datenbank
3. Klicken Sie auf "Data" Tab
4. Prüfen Sie, ob die neue Tabelle erscheint

---

## 📝 BEISPIEL: verification_documents

### **1. Migration-Endpunkt erstellt:**
`server/routes/create-verification-table.js`

### **2. SQL-Schema:**
```sql
CREATE TABLE IF NOT EXISTS verification_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INTEGER REFERENCES users(id),
  is_current BOOLEAN DEFAULT TRUE,
  replaced_by INTEGER REFERENCES verification_documents(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_verification_documents_user_id 
ON verification_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_documents_type 
ON verification_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_verification_documents_current 
ON verification_documents(is_current);
```

### **3. Ausgeführt:**
```bash
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/create-verification-table
```

### **4. Ergebnis:**
```json
{
  "success": true,
  "message": "verification_documents table created successfully!",
  "columnCount": 12,
  "expectedColumns": 12,
  "allGood": true
}
```

---

## ✅ VORTEILE DIESER METHODE

1. **Sicher:** Keine Gefahr für bestehende Daten
2. **Kontrolliert:** Sie entscheiden wann die Migration läuft
3. **Testbar:** Kann in Entwicklung getestet werden
4. **Wiederholbar:** `IF NOT EXISTS` verhindert Fehler bei erneuter Ausführung
5. **Verifizierbar:** Sofortige Bestätigung ob erfolgreich

---

## ⚠️ WICHTIGE HINWEISE

### **DO's:**
- ✅ Immer `IF NOT EXISTS` verwenden
- ✅ Transaktionen verwenden (BEGIN/COMMIT/ROLLBACK)
- ✅ Indexes separat erstellen
- ✅ Spaltenanzahl verifizieren
- ✅ In Entwicklung testen

### **DON'Ts:**
- ❌ Keine `DROP TABLE` in Produktion
- ❌ Keine Änderungen an bestehenden Tabellen ohne Backup
- ❌ Keine Foreign Keys ohne `IF NOT EXISTS`
- ❌ Migration nicht mehrfach ausführen (außer mit `IF NOT EXISTS`)

---

## 🔧 TROUBLESHOOTING

### **Problem: "Table already exists"**
**Lösung:** Das ist OK! `IF NOT EXISTS` verhindert Fehler.

### **Problem: "Foreign key constraint fails"**
**Lösung:** Prüfen Sie, ob die referenzierte Tabelle existiert.

### **Problem: "Connection timeout"**
**Lösung:** 
1. Prüfen Sie Railway Logs: `railway logs`
2. Prüfen Sie DATABASE_URL Environment Variable
3. Deployment könnte noch nicht fertig sein

### **Problem: "Column count mismatch"**
**Lösung:** 
1. Prüfen Sie SQL-Schema
2. Zählen Sie Spalten manuell
3. Prüfen Sie ob alle CREATE INDEX erfolgreich waren

---

## 📚 WEITERE RESSOURCEN

- Railway Dokumentation: https://docs.railway.app
- PostgreSQL Dokumentation: https://www.postgresql.org/docs/
- Node.js pg Library: https://node-postgres.com/

---

## 🎯 ZUSAMMENFASSUNG

**Diese Methode ist:**
- ✅ Produktionsbereit
- ✅ Sicher
- ✅ Einfach zu verwenden
- ✅ Wiederholbar

**Verwenden Sie diese Methode für alle zukünftigen Datenbank-Migrationen auf Railway!**
