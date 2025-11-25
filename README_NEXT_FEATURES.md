# 🚀 Courierly - Nächste Features

## 📋 Übersicht

Dieses Dokument beschreibt die nächsten Features, die implementiert werden müssen, um die Courierly Transport App zu vervollständigen.

---

## 1️⃣ Stornierte Aufträge in Abrechnung

### 🎯 Ziel
Stornierte Aufträge müssen beim Kunden unter "Abgeschlossene Aufträge" und "Abrechnungen" angezeigt werden, da der Kunde bei Stornierung innerhalb von 24h eine Stornierungsgebühr zahlen muss.

### 📝 Anforderungen

#### Frontend-Änderungen:

**1. CustomerDashboard.jsx - Tab "Abgeschlossene Aufträge"**
```javascript
// Datei: client/src/pages/CustomerDashboard.jsx
// Zeile: ~186

// VORHER:
orders.filter(o => o.status === 'completed' || o.status === 'pending_approval')

// NACHHER:
orders.filter(o => 
  o.status === 'completed' || 
  o.status === 'pending_approval' ||
  o.cancellation_status === 'cancelled_by_customer'
)
```

**2. Stornierungsgebühr anzeigen**
```javascript
// In der Tabelle bei "Preis":
{order.cancellation_status === 'cancelled_by_customer' && (
  <div className="text-xs bg-red-50 border border-red-200 rounded p-2 mt-2">
    <div className="font-semibold text-red-900">
      🚫 Stornierungsgebühr
    </div>
    <div className="text-red-700">
      €{parseFloat(order.cancellation_fee || 0).toFixed(2)}
    </div>
    <div className="text-xs text-gray-600 mt-1">
      Storniert am: {new Date(order.cancelled_at).toLocaleDateString('de-DE')}
    </div>
  </div>
)}
```

**3. ReportsSummary.jsx - Stornierte Aufträge in Reports**
```javascript
// Datei: client/src/components/ReportsSummary.jsx
// Zeile: ~35-65

// In fetchSummary() die Query anpassen:
const response = await api.get('/reports/summary', {
  params: { 
    startDate, 
    endDate,
    includeCancelled: true // NEU
  }
});
```

#### Backend-Änderungen:

**1. reports.js - Query anpassen**
```javascript
// Datei: server/routes/reports.js
// Zeile: ~37

// VORHER:
WHERE (o.status = 'completed' OR o.cancellation_status IS NOT NULL)

// NACHHER:
WHERE (
  o.status = 'completed' 
  OR o.status = 'pending_approval'
  OR o.cancellation_status = 'cancelled_by_customer'
)
```

**2. Stornierungsgebühren in Summary einbeziehen**
```javascript
// Datei: server/routes/reports.js
// Zeile: ~96-167

// In der forEach-Schleife:
orders.forEach(order => {
  const customerPrice = parseFloat(order.customer_price || order.price) || 0;
  const cancellationFee = parseFloat(order.cancellation_fee) || 0;
  
  if (order.cancellation_status === 'cancelled_by_customer') {
    summary.totalRevenue += cancellationFee;
    summary.totalCancellationFees += cancellationFee; // Neue Kategorie
  } else {
    summary.totalRevenue += customerPrice;
  }
  
  // ... rest of the code
});
```

### ✅ Akzeptanzkriterien
- [ ] Stornierte Aufträge erscheinen unter "Abgeschlossene Aufträge"
- [ ] Stornierungsgebühr wird korrekt angezeigt
- [ ] Stornierte Aufträge erscheinen in der Abrechnung
- [ ] Stornierungsgebühr wird in der Gesamtsumme berücksichtigt
- [ ] Stornierungsdatum wird angezeigt
- [ ] Stornierungsgrund wird angezeigt (falls vorhanden)

### 🧪 Test-Szenarien
1. Kunde storniert Auftrag innerhalb 24h → Gebühr 100%
2. Kunde storniert Auftrag >24h vor Abholung → Gebühr 30%
3. Stornierter Auftrag erscheint in "Abgeschlossene Aufträge"
4. Stornierungsgebühr erscheint in Abrechnung
5. CSV-Export enthält stornierte Aufträge

---

## 2️⃣ Retouren-System

### 🎯 Ziel
Admin kann Retouren starten, wenn der Empfänger nicht angetroffen wird. Der Fahrer muss das Transportgut zum Absender zurückbringen. Die Retourengebühr wird automatisch zur Abrechnung hinzugefügt.

### 📝 Anforderungen

#### Datenbank-Migration:

```sql
-- Neue Spalten für Retouren
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none' 
  CHECK (return_status IN ('none', 'pending', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_initiated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Kommentare
COMMENT ON COLUMN transport_orders.return_status IS 'Status der Retoure: none, pending, in_progress, completed';
COMMENT ON COLUMN transport_orders.return_fee IS 'Retourengebühr (max. Auftragswert)';
COMMENT ON COLUMN transport_orders.return_reason IS 'Grund für die Retoure (z.B. Empfänger nicht angetroffen)';
COMMENT ON COLUMN transport_orders.return_initiated_by IS 'Admin der die Retoure gestartet hat';
COMMENT ON COLUMN transport_orders.return_notes IS 'Zusätzliche Notizen zur Retoure';

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON transport_orders(return_status);
```

#### Backend - Neue API-Endpunkte:

**1. Retoure starten**
```javascript
// Datei: server/routes/admin.js

router.post('/orders/:id/initiate-return', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { returnFee, reason, notes } = req.body;
    const adminId = req.user.id;
    
    // Auftrag abrufen
    const order = await pool.query(
      'SELECT * FROM transport_orders WHERE id = $1',
      [id]
    );
    
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    const orderData = order.rows[0];
    
    // Validierung: returnFee <= Auftragswert
    const maxReturnFee = parseFloat(orderData.customer_price || orderData.price);
    if (returnFee > maxReturnFee) {
      return res.status(400).json({ 
        error: `Retourengebühr darf nicht höher als der Auftragswert sein (max. €${maxReturnFee.toFixed(2)})` 
      });
    }
    
    // Retoure starten
    await pool.query(
      `UPDATE transport_orders 
       SET return_status = 'pending',
           return_fee = $1,
           return_reason = $2,
           return_notes = $3,
           return_initiated_at = NOW(),
           return_initiated_by = $4
       WHERE id = $5`,
      [returnFee, reason, notes, adminId, id]
    );
    
    // Email an Kunde und Fahrer senden
    await sendReturnNotification(orderData, returnFee, reason);
    
    res.json({ 
      success: true, 
      message: 'Retoure erfolgreich gestartet',
      returnFee,
      reason
    });
  } catch (error) {
    console.error('Error initiating return:', error);
    res.status(500).json({ error: 'Fehler beim Starten der Retoure' });
  }
});
```

**2. Retoure abschließen**
```javascript
router.post('/orders/:id/complete-return', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Retoure abschließen
    await pool.query(
      `UPDATE transport_orders 
       SET return_status = 'completed',
           return_completed_at = NOW(),
           status = 'completed'
       WHERE id = $1`,
      [id]
    );
    
    res.json({ 
      success: true, 
      message: 'Retoure erfolgreich abgeschlossen' 
    });
  } catch (error) {
    console.error('Error completing return:', error);
    res.status(500).json({ error: 'Fehler beim Abschließen der Retoure' });
  }
});
```

**3. Retouren-Status abrufen**
```javascript
router.get('/orders/:id/return-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT return_status, return_fee, return_reason, return_notes,
              return_initiated_at, return_completed_at,
              u.first_name as initiated_by_name
       FROM transport_orders o
       LEFT JOIN users u ON o.return_initiated_by = u.id
       WHERE o.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    res.json({ returnInfo: result.rows[0] });
  } catch (error) {
    console.error('Error fetching return status:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Retouren-Status' });
  }
});
```

#### Frontend - Neue Komponenten:

**1. InitiateReturnModal.jsx**
```javascript
// Datei: client/src/components/InitiateReturnModal.jsx

import React, { useState } from 'react';
import { X, TruckIcon, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const InitiateReturnModal = ({ order, onClose, onSuccess }) => {
  const [returnFee, setReturnFee] = useState(order.customer_price || order.price);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const maxReturnFee = parseFloat(order.customer_price || order.price);
  
  const reasons = [
    'Empfänger nicht angetroffen',
    'Falsche Adresse',
    'Empfänger verweigert Annahme',
    'Beschädigtes Transportgut',
    'Sonstiges'
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post(`/admin/orders/${order.id}/initiate-return`, {
        returnFee: parseFloat(returnFee),
        reason,
        notes
      });
      
      alert('Retoure erfolgreich gestartet');
      onSuccess();
    } catch (error) {
      console.error('Error initiating return:', error);
      alert(error.response?.data?.error || 'Fehler beim Starten der Retoure');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <TruckIcon className="mr-2" />
            Retoure starten
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X />
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-600 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Der Fahrer muss das Transportgut zum Absender zurückbringen.
              Die Retourengebühr wird automatisch zur Rechnung hinzugefügt.
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grund für Retoure *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Bitte wählen...</option>
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retourengebühr * (max. €{maxReturnFee.toFixed(2)})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={maxReturnFee}
              value={returnFee}
              onChange={(e) => setReturnFee(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Notizen
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="z.B. Kontaktversuche, besondere Umstände..."
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Wird gestartet...' : 'Retoure starten'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitiateReturnModal;
```

**2. AdminDashboard.jsx - Integration**
```javascript
// Datei: client/src/pages/AdminDashboard.jsx

import InitiateReturnModal from '../components/InitiateReturnModal';

// Im Component:
const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);

// In der Tabelle bei "Aktionen":
{(order.status === 'delivered' || order.status === 'in_transit') && 
 order.return_status === 'none' && (
  <button
    onClick={() => setSelectedOrderForReturn(order)}
    className="text-red-600 hover:text-red-900 flex items-center space-x-1"
  >
    <TruckIcon className="h-4 w-4" />
    <span>Retoure</span>
  </button>
)}

// Modal:
{selectedOrderForReturn && (
  <InitiateReturnModal
    order={selectedOrderForReturn}
    onClose={() => setSelectedOrderForReturn(null)}
    onSuccess={() => {
      setSelectedOrderForReturn(null);
      fetchOrders();
    }}
  />
)}
```

**3. Retouren-Anzeige in CustomerDashboard**
```javascript
// In der Preis-Spalte:
{order.return_status !== 'none' && (
  <div className="text-xs bg-orange-50 border border-orange-200 rounded p-2 mt-2">
    <div className="font-semibold text-orange-900">
      🔄 Retoure
    </div>
    <div className="text-orange-700">
      +€{parseFloat(order.return_fee || 0).toFixed(2)}
    </div>
    <div className="text-xs text-gray-600 mt-1">
      Grund: {order.return_reason}
    </div>
    {order.return_status === 'completed' && (
      <div className="text-xs text-green-600 mt-1">
        ✓ Abgeschlossen
      </div>
    )}
  </div>
)}
```

#### Backend - Abrechnung anpassen:

**reports.js - Retourengebühr einbeziehen**
```javascript
// Datei: server/routes/reports.js
// Zeile: ~96-167

orders.forEach(order => {
  const customerPrice = parseFloat(order.customer_price || order.price) || 0;
  const contractorPrice = parseFloat(order.contractor_price || order.price) || 0;
  const waitingTimeFee = order.waiting_time_approved ? parseFloat(order.waiting_time_fee || 0) : 0;
  const returnFee = parseFloat(order.return_fee) || 0; // NEU
  
  if (userRole === 'admin') {
    summary.totalRevenue += customerPrice + waitingTimeFee + returnFee; // NEU
    summary.totalContractorPayout += contractorPrice + waitingTimeFee + returnFee; // NEU
    summary.totalReturnFees += returnFee; // NEU - Neue Kategorie
    
    // ... rest of the code
  }
  
  // ... rest of the code
});
```

### ✅ Akzeptanzkriterien
- [ ] Admin kann Retoure starten
- [ ] Retourengebühr kann festgelegt werden (max. Auftragswert)
- [ ] Retourengrund wird erfasst
- [ ] Email-Benachrichtigung an Kunde und Fahrer
- [ ] Retourenstatus wird im Dashboard angezeigt
- [ ] Retourengebühr wird automatisch zur Abrechnung hinzugefügt
- [ ] Retoure kann abgeschlossen werden
- [ ] Retouren-Historie ist einsehbar

### 🧪 Test-Szenarien
1. Admin startet Retoure → Status ändert sich zu "pending"
2. Retourengebühr > Auftragswert → Fehler
3. Email wird an Kunde und Fahrer gesendet
4. Retourengebühr erscheint in Abrechnung
5. Retoure abschließen → Status ändert sich zu "completed"
6. CSV-Export enthält Retourengebühren

---

## 🎨 UI/UX Verbesserungen

### Farbschema für Status:
- **Storniert**: 🔴 Rot (`bg-red-100 text-red-800`)
- **Retoure**: 🟠 Orange (`bg-orange-100 text-orange-800`)
- **Wartezeit**: 🟡 Gelb (`bg-yellow-100 text-yellow-800`)
- **Abgeschlossen**: 🟢 Grün (`bg-green-100 text-green-800`)

### Icons:
- **Stornierung**: `XCircle` oder `Ban`
- **Retoure**: `TruckIcon` mit Pfeil zurück
- **Wartezeit**: `Clock`
- **Abgeschlossen**: `CheckCircle`

---

## 📧 Email-Templates

### Retouren-Benachrichtigung (Kunde):
```
Betreff: Retoure für Auftrag #${orderId} gestartet

Sehr geehrte/r ${customerName},

leider konnte Ihr Auftrag #${orderId} nicht zugestellt werden.

Grund: ${returnReason}

Unser Fahrer wird das Transportgut zum Absender zurückbringen.

Retourengebühr: €${returnFee}

Diese Gebühr wird Ihrer nächsten Rechnung hinzugefügt.

Mit freundlichen Grüßen,
Ihr Courierly Team
```

### Retouren-Benachrichtigung (Fahrer):
```
Betreff: Retoure für Auftrag #${orderId}

Hallo ${contractorName},

für Auftrag #${orderId} wurde eine Retoure gestartet.

Grund: ${returnReason}

Bitte bringen Sie das Transportgut zum Absender zurück:
${pickupAddress}

Retourengebühr: €${returnFee}

Mit freundlichen Grüßen,
Ihr Courierly Team
```

---

## 🔄 Workflow-Diagramm

### Retouren-Workflow:
```
1. Fahrer meldet: "Empfänger nicht angetroffen"
   ↓
2. Admin startet Retoure
   - Grund auswählen
   - Retourengebühr festlegen
   ↓
3. System sendet Emails
   - An Kunde: Retoure gestartet
   - An Fahrer: Zurück zum Absender
   ↓
4. Fahrer bringt Transportgut zurück
   ↓
5. Admin schließt Retoure ab
   ↓
6. Retourengebühr wird zur Rechnung hinzugefügt
```

---

## 📊 Statistiken & Reports

### Neue Metriken:
- **Retourenquote**: Anzahl Retouren / Gesamtaufträge
- **Durchschnittliche Retourengebühr**: Summe Retourengebühren / Anzahl Retouren
- **Häufigste Retourengründe**: Gruppierung nach Grund

### Dashboard-Widgets:
```javascript
<div className="bg-white rounded-lg shadow p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">Retouren</p>
      <p className="text-2xl font-bold text-orange-600">{stats.returns}</p>
    </div>
    <TruckIcon className="h-10 w-10 text-orange-400" />
  </div>
</div>
```

---

## 🚀 Deployment-Checkliste

### Vor dem Deployment:
- [ ] Datenbank-Migration ausführen
- [ ] Backend-Tests durchführen
- [ ] Frontend-Tests durchführen
- [ ] Email-Templates testen
- [ ] Dokumentation aktualisieren

### Nach dem Deployment:
- [ ] Smoke-Tests durchführen
- [ ] Monitoring überprüfen
- [ ] Logs überprüfen
- [ ] Kunden informieren (falls nötig)

---

**Erstellt am**: 25. November 2025
**Version**: 1.0
**Status**: Bereit für Implementierung
