# 📧 Contractor Email-Benachrichtigungen

## Aktueller Status (11. November 2025)

**ALLE verifizierten Contractors werden bei jedem neuen Auftrag benachrichtigt.**

---

## ⚠️ WICHTIG: Für viele Contractors zurückstellen!

Wenn Sie viele Contractors im System haben, sollten Sie die Benachrichtigungen auf **PLZ-Bereich** beschränken!

**Warum?**
- Zu viele Benachrichtigungen nerven Contractors
- Irrelevante Aufträge (falsche Region) sind nicht hilfreich
- Bessere User Experience mit gezielten Benachrichtigungen

---

## 🔧 Wie man es zurückstellt

### Datei: `server/controllers/orderController.js`

**Zeile 149-173:** Contractor-Benachrichtigungen

### Aktueller Code (ALLE Contractors):

```javascript
// Notify ALL verified contractors about new order
try {
  const contractors = await pool.query(
    `SELECT email, first_name, last_name FROM users 
     WHERE role = 'contractor' 
     AND account_status = 'verified'
     AND email IS NOT NULL`
  );

  console.log(`📧 Sending new order notifications to ${contractors.rows.length} contractors...`);
  
  for (const contractor of contractors.rows) {
    try {
      await sendNewOrderNotification(contractor.email, order);
      console.log(`  ✅ Notified ${contractor.first_name} ${contractor.last_name}`);
    } catch (emailError) {
      console.error(`  ❌ Failed to notify ${contractor.email}:`, emailError.message);
    }
  }
  
  console.log(`✅ Notified ${contractors.rows.length} contractors about new order #${order.id}`);
} catch (notifyError) {
  console.error('Error notifying contractors:', notifyError);
  // Don't fail the request if notification fails
}
```

---

### Geänderter Code (NUR PLZ-Bereich):

```javascript
// Notify contractors in the postal code area
try {
  const contractors = await pool.query(
    `SELECT email, first_name, last_name FROM users 
     WHERE role = 'contractor' 
     AND account_status = 'verified'
     AND email IS NOT NULL
     AND notification_postal_codes IS NOT NULL 
     AND ($1 = ANY(notification_postal_codes) OR $2 = ANY(notification_postal_codes))`,
    [orderData.pickup_postal_code, orderData.delivery_postal_code]
  );

  console.log(`📧 Sending new order notifications to ${contractors.rows.length} contractors in PLZ area...`);
  
  for (const contractor of contractors.rows) {
    try {
      await sendNewOrderNotification(contractor.email, order);
      console.log(`  ✅ Notified ${contractor.first_name} ${contractor.last_name}`);
    } catch (emailError) {
      console.error(`  ❌ Failed to notify ${contractor.email}:`, emailError.message);
    }
  }
  
  console.log(`✅ Notified ${contractors.rows.length} contractors about new order #${order.id}`);
} catch (notifyError) {
  console.error('Error notifying contractors:', notifyError);
  // Don't fail the request if notification fails
}
```

---

## 📋 Was ändert sich?

### Aktuell (ALLE):
- ✅ Jeder verifizierte Contractor bekommt Email
- ✅ Gut für wenige Contractors (< 10)
- ❌ Schlecht für viele Contractors (> 50)

### Mit PLZ-Filter:
- ✅ Nur Contractors in relevanten PLZ-Bereichen
- ✅ Weniger Spam
- ✅ Bessere User Experience
- ❌ Contractors müssen PLZ-Bereiche hinterlegen

---

## 🔄 Wie Contractors PLZ-Bereiche hinterlegen

### Option 1: In der Datenbank

```sql
UPDATE users 
SET notification_postal_codes = ARRAY['10115', '10117', '10119', '10178', '10179']
WHERE id = 123 AND role = 'contractor';
```

### Option 2: Im Frontend (TODO)

Erstellen Sie eine Einstellungsseite für Contractors:
- Mehrere PLZ-Bereiche eingeben
- Speichern in `notification_postal_codes` Array
- File: `client/src/pages/ContractorSettings.jsx`

---

## 🎯 Empfehlung

**Bis 10 Contractors:** Aktueller Code ist OK (ALLE benachrichtigen)

**Ab 10 Contractors:** Auf PLZ-Filter umstellen

**Ab 50 Contractors:** PLZ-Filter ist PFLICHT!

---

## 📝 Änderungshistorie

- **11.11.2025:** Geändert auf ALLE Contractors (für Testing)
- **Zukunft:** Zurück auf PLZ-Filter wenn mehr Contractors

---

## 🚀 Deployment

Nach Änderung:
1. Code in `orderController.js` anpassen
2. `git add . && git commit -m "chore: Switch to PLZ-based notifications"`
3. `git push`
4. Railway Restart

---

**Erstellt am:** 11. November 2025, 13:05 Uhr
