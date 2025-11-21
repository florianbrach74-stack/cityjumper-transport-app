# 🔧 TROUBLESHOOTING - Aktuelle Fehler

## ❌ FEHLER 1: Payment Status Update funktioniert nicht

### Problem:
```
PATCH /invoices/2025-0010/payment-status
→ 404 Error oder keine Response
```

### Root Cause Analyse:

**Es gibt ZWEI payment-status Routen:**

1. `/api/reports/invoice/:invoiceNumber/payment-status` (reports.js)
   - Parameter: `paymentStatus` ODER `payment_status`
   - Funktioniert

2. `/api/invoices/:invoiceNumber/payment-status` (invoice-history.js)
   - Parameter: `payment_status`
   - Sollte funktionieren

**Frontend ruft auf:**
```javascript
/api/invoices/${invoiceNumber}/payment-status
```

**Das sollte funktionieren, aber tut es nicht!**

### Mögliche Ursachen:

1. ✅ Route existiert in invoice-history.js (Zeile 258)
2. ✅ Route ist registriert in index.js (Zeile 76)
3. ❓ Middleware authorizeRole('admin') blockiert?
4. ❓ Frontend-Cache?
5. ❓ Railway Deployment-Problem?

### Lösung:

**Option A: Frontend auf funktionierende Route umstellen**
```javascript
// ÄNDERN VON:
/api/invoices/${invoiceNumber}/payment-status

// ZU:
/api/reports/invoice/${invoiceNumber}/payment-status
```

**Option B: Debugging aktivieren**
```javascript
// In invoice-history.js vor der Route:
console.log('📍 Payment status route registered');

// In der Route:
console.log('📍 Payment status update called:', invoiceNumber, payment_status);
```

---

## ❌ FEHLER 2: Role-Switch SQL Syntax Error

### Problem:
```
Error switching role: syntax error at or near "current_role"
```

### Root Cause:
`current_role` ist ein reserviertes Wort in PostgreSQL

### Lösung:
✅ BEHOBEN in commit a5bbfe4
- Alle `current_role` in Anführungszeichen: `"current_role"`

---

## 🎯 SOFORT-FIX FÜR PAYMENT STATUS:

### Schritt 1: Frontend auf funktionierende Route umstellen

Datei: `client/src/components/ReportsSummary.jsx`

```javascript
// ZEILE 217 ÄNDERN VON:
`${import.meta.env.VITE_API_URL}/invoices/${encodedInvoiceNumber}/payment-status`

// ZU:
`${import.meta.env.VITE_API_URL}/reports/invoice/${encodedInvoiceNumber}/payment-status`
```

### Schritt 2: Parameter anpassen

```javascript
// BEIDE Parameter senden für Kompatibilität:
{
  payment_status: newStatus,
  paymentStatus: newStatus
}
```

---

## 📊 VERIFICATION:

Nach dem Fix testen:

```bash
# Test Payment Status Update
curl -X PATCH https://cityjumper-api-production-01e4.up.railway.app/api/reports/invoice/2025-0010/payment-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"payment_status":"paid","paymentStatus":"paid"}'

# Test Role Switch
curl -X POST https://cityjumper-api-production-01e4.up.railway.app/api/user/switch-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"targetRole":"customer"}'
```

---

## ✅ FINALE LÖSUNG:

Beide Routen sollten funktionieren. Wenn `/api/invoices/...` nicht funktioniert, nutzen wir `/api/reports/invoice/...` als Fallback.
