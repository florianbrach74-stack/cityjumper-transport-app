# Multi-Stop Workflow - Implementierungsplan

## ✅ Was bereits funktioniert:

1. **CMR Erstellung**: Alle CMRs werden automatisch beim "Paket abholen" erstellt
2. **Empfängername**: Wird korrekt in Feld 2 eingetragen
3. **API Endpunkte**: `/api/cmr/order/:orderId/next-delivery` existiert
4. **Unterschriften**: Funktionieren pro CMR

## 🔧 Was noch implementiert werden muss:

### 1. Frontend: Dynamischer Button-Text

**Datei**: `client/src/pages/ContractorDashboard.jsx`

**Änderung**: Button soll zeigen:
- "Stop 1 abschließen" (wenn CMR 1 offen)
- "Stop 2 abschließen" (wenn CMR 2 offen)  
- "Auftrag abschließen" (wenn letzter Stop)

**Code**:
```javascript
// Fetch next pending CMR
const [nextCMR, setNextCMR] = useState(null);

useEffect(() => {
  if (order.status === 'picked_up') {
    fetchNextCMR(order.id);
  }
}, [order]);

const fetchNextCMR = async (orderId) => {
  const response = await api.get(`/cmr/order/${orderId}/next-delivery`);
  setNextCMR(response.data.cmr);
};

// Button text
const getDeliveryButtonText = (order) => {
  if (!nextCMR) return 'Auftrag abschließen';
  
  const stopNumber = nextCMR.delivery_stop_index + 1;
  const totalStops = nextCMR.total_stops;
  
  if (stopNumber === totalStops) {
    return `Stop ${stopNumber}/${totalStops} abschließen (Letzter!)`;
  }
  return `Stop ${stopNumber}/${totalStops} abschließen`;
};
```

### 2. Backend: Email nur beim letzten Stop

**Datei**: `server/controllers/cmrController.js`

**Funktion**: `confirmDelivery`

**Änderung**:
```javascript
// Check if this is the last CMR
const allCMRs = await CMR.findByGroupId(cmrGroupId);
const allCompleted = allCMRs.every(cmr => 
  cmr.consignee_signature || cmr.delivery_photo_base64
);

if (allCompleted) {
  // This was the last stop - send email with combined PDF
  await sendCompletionEmail(orderId);
  
  // Update order status to completed
  await pool.query(
    'UPDATE transport_orders SET status = $1 WHERE id = $2',
    ['completed', orderId]
  );
}
```

### 3. Backend: Kombiniertes PDF

**Datei**: `server/services/multiStopPdfGenerator.js`

**Funktion**: Bereits vorhanden! `generateCombinedPDF(orderId, cmrGroupId)`

**Verwendung**:
```javascript
const { filepath, filename } = await MultiStopPdfGenerator.generateCombinedPDF(
  orderId,
  `ORDER-${orderId}`
);

// Send email with PDF
await sendEmail({
  to: customer.email,
  subject: `Auftrag #${orderId} abgeschlossen`,
  attachments: [{ path: filepath }]
});
```

## 📝 Migration

Keine DB-Migration nötig - alle Felder existieren bereits!

## 🧪 Test-Szenario

**Auftrag #65**: 2 Stops (Adolf-Menzel-Straße, Bernauer Straße)

1. **Paket abholen**:
   - ✅ 2 CMRs erstellt
   - ✅ Absender + Frachtführer unterschreiben

2. **Stop 1 abschließen**:
   - Button: "Stop 1/2 abschließen"
   - Empfänger unterschreibt oder Foto
   - ❌ KEINE Email
   - Status bleibt "picked_up"

3. **Stop 2 abschließen**:
   - Button: "Stop 2/2 abschließen (Letzter!)"
   - Empfänger unterschreibt oder Foto
   - ✅ Email mit kombiniertem PDF (beide CMRs)
   - Status → "completed"

## 🚀 Deployment

1. Code committen
2. Railway deployed automatisch
3. Testen mit neuem Auftrag
4. Bestehende Aufträge funktionieren weiter

## ⚠️ Wichtig

- Bestehende Single-Stop Aufträge funktionieren unverändert
- Multi-Stop wird automatisch erkannt
- Keine Breaking Changes
