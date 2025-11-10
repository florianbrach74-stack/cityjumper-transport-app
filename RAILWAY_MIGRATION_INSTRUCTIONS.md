# 🚀 Railway Migration: Employee Assignment System

## Schritt 1: SQL in Railway ausführen

1. **Railway Dashboard öffnen:**
   - https://railway.app
   - Ihr Projekt auswählen
   - PostgreSQL Service auswählen

2. **Query Tab öffnen:**
   - Klicken Sie auf "Query"
   - Oder verwenden Sie das SQL-Terminal

3. **SQL ausführen:**

```sql
-- Employee Assignment System Migration

-- 1. Add employee assignment settings to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_assignment_mode VARCHAR(50) DEFAULT 'all_access' 
CHECK (employee_assignment_mode IN ('all_access', 'manual_assignment'));

-- 2. Add assigned employee to transport_orders table
ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS assigned_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee ON transport_orders(assigned_employee_id);

-- 4. Add comments for documentation
COMMENT ON COLUMN users.employee_assignment_mode IS 'all_access: All employees see all orders, manual_assignment: Orders must be assigned to specific employees';
COMMENT ON COLUMN transport_orders.assigned_employee_id IS 'Employee assigned to this order (if contractor uses manual assignment mode)';
```

4. **Ausführen klicken**

5. **Verifizieren:**

```sql
-- Check users table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'employee_assignment_mode';

-- Check transport_orders table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transport_orders' AND column_name = 'assigned_employee_id';

-- Check index
SELECT indexname
FROM pg_indexes
WHERE tablename = 'transport_orders' AND indexname = 'idx_orders_assigned_employee';
```

---

## Schritt 2: Backend ist bereits deployed ✅

Das Backend wurde bereits mit dem letzten Push deployed:
- ✅ API-Endpoints funktionieren
- ✅ Middleware-Fix angewendet
- ✅ Bereit für Frontend

---

## Schritt 3: Frontend-Routes hinzufügen

Die Frontend-Komponenten sind erstellt, müssen aber noch in die App integriert werden.

**Nächste Schritte:**
1. Routes zu App.jsx hinzufügen
2. Navigation aktualisieren
3. Testen

---

## ✅ Checkliste

- [ ] SQL-Migration in Railway ausgeführt
- [ ] Verifizierung erfolgreich
- [ ] Backend läuft (bereits deployed)
- [ ] Frontend-Routes hinzugefügt
- [ ] Navigation aktualisiert
- [ ] Funktionalität getestet

---

**Status:** Bereit für Migration! 🚀
