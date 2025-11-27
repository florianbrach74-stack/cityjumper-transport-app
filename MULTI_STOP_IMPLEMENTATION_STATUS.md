# 🚀 Multi-Stop CMR System - Implementation Status

## ✅ COMPLETED (Backend)

### 1. Database Schema ✅
- `cmr_group_id` - Groups all CMRs of an order
- `delivery_stop_index` - Position in delivery sequence
- `total_stops` - Total number of deliveries
- `is_multi_stop` - Flag for multi-stop orders
- `can_share_sender_signature` - Smart detection
- `can_share_receiver_signature` - Smart detection (Name + Address!)
- `shared_sender_signature` - Shared signature data
- `shared_carrier_signature` - Shared signature data
- `shared_receiver_signature` - Shared signature data
- `delivery_photo_base64` - Photo per delivery
- `shared_delivery_photo_base64` - Shared photo

### 2. Backend Logic ✅
- Automatic multi-stop detection
- Smart signature sharing:
  - Multiple pickups → Each sender signs separately
  - Single pickup → Sender signs once (shared)
  - Multiple deliveries to SAME RECIPIENT (name + address) → Receiver signs once
  - Multiple pickups to single receiver → Receiver signs once
- One CMR per delivery address
- Recipient check (not just address!)

### 3. API Endpoints ✅
```
GET  /api/cmr/order/:orderId/group           - Get all CMRs for order
GET  /api/cmr/order/:orderId/next-delivery   - Get next pending delivery
POST /api/cmr/order/:orderId/shared-signatures - Update shared signatures
POST /api/cmr/:cmrId/delivery-photo          - Upload delivery photo
```

### 4. Testing ✅
- Test script creates multi-stop order
- Verifies CMR creation (3 CMRs for 3 deliveries)
- Tests signature sharing
- Tests API endpoints
- All working!

## ⏳ TODO (Frontend)

### 1. CMRSignature Component Enhancement
**File:** `client/src/components/CMRSignature.jsx`

**Changes needed:**
1. Detect if order is multi-stop
2. Show progress indicator (e.g., "Delivery 1/3")
3. For pickup:
   - Collect sender + carrier signatures once
   - Apply to all CMRs in group
4. For delivery:
   - Check if can share receiver signature
   - If yes: One signature for all
   - If no: Sequential delivery flow
5. Add photo capture per delivery
6. Auto-navigate to next delivery

### 2. Sequential Delivery Flow
```
Delivery Mode (Multi-Stop):

Step 1: Pickup
  ✅ Sender signs once
  ✅ Carrier signs once
  → Applied to all CMRs

Step 2: Delivery 1/3
  📍 Max Mustermann, Potsdamer Platz
  Options:
    [✍️ Unterschrift] [📸 Foto (nicht da)]
  → Next delivery

Step 3: Delivery 2/3
  📍 Anna Schmidt, Friedrichstraße
  Options:
    [✍️ Unterschrift] [📸 Foto (nicht da)]
  → Next delivery

Step 4: Delivery 3/3
  📍 Peter Müller, Kurfürstendamm
  Options:
    [✍️ Unterschrift] [📸 Foto (nicht da)]
  → Complete!
```

### 3. UI Components Needed
- Progress bar (1/3, 2/3, 3/3)
- "Empfänger nicht da" button
- Photo capture modal
- Auto-navigation between stops
- Completion screen

## 📋 Implementation Plan

### Phase 1: Detect Multi-Stop ✅
```javascript
// In CMRSignature.jsx
const [cmrGroup, setCmrGroup] = useState(null);
const [currentStopIndex, setCurrentStopIndex] = useState(0);

useEffect(() => {
  // Fetch CMR group
  fetch(`/api/cmr/order/${order.id}/group`)
    .then(res => res.json())
    .then(data => {
      if (data.isMultiStop) {
        setCmrGroup(data);
      }
    });
}, [order.id]);
```

### Phase 2: Pickup with Shared Signatures ✅
```javascript
const handlePickupConfirm = async (signatures) => {
  if (cmrGroup?.isMultiStop && cmrGroup.canShareSenderSignature) {
    // Apply to all CMRs
    await fetch(`/api/cmr/order/${order.id}/shared-signatures`, {
      method: 'POST',
      body: JSON.stringify({
        senderSignature: signatures.sender,
        carrierSignature: signatures.carrier
      })
    });
  } else {
    // Normal flow
    await onConfirm(signatures);
  }
};
```

### Phase 3: Sequential Delivery ✅
```javascript
const handleDeliveryConfirm = async (signature, photo) => {
  const currentCMR = cmrGroup.cmrs[currentStopIndex];
  
  // Save signature/photo for current stop
  if (photo) {
    await fetch(`/api/cmr/${currentCMR.id}/delivery-photo`, {
      method: 'POST',
      body: JSON.stringify({ photoBase64: photo })
    });
  }
  
  // Check if more deliveries
  const nextDelivery = await fetch(`/api/cmr/order/${order.id}/next-delivery`);
  const data = await nextDelivery.json();
  
  if (data.completed) {
    // All done!
    onComplete();
  } else {
    // Next delivery
    setCurrentStopIndex(currentStopIndex + 1);
  }
};
```

## 🧪 Testing Checklist

### Scenario 1: Single Pickup → Multiple Deliveries
- [ ] Create order with 3 delivery addresses
- [ ] Pickup: Sender signs once
- [ ] Pickup: Carrier signs once
- [ ] Delivery 1: Receiver signs
- [ ] Delivery 2: Receiver signs
- [ ] Delivery 3: Receiver signs
- [ ] Verify: 3 CMRs created
- [ ] Verify: All have same sender/carrier signatures
- [ ] Verify: Each has different receiver signature

### Scenario 2: Multiple Deliveries, Same Recipient
- [ ] Create order with 3 deliveries to "Max Müller, Hauptstr. 1"
- [ ] Pickup: Signatures collected
- [ ] Delivery: Receiver signs ONCE
- [ ] Verify: Signature applied to all 3 CMRs

### Scenario 3: Same Address, Different Names
- [ ] Create order: Max Müller + Anna Müller (same address)
- [ ] Verify: 2 separate CMRs
- [ ] Verify: 2 separate signatures required

### Scenario 4: Receiver Not Home
- [ ] Delivery: Click "Nicht da"
- [ ] Take photo of packages
- [ ] Verify: Photo saved
- [ ] Verify: No signature required

## 📊 Current Status

```
Backend:     ████████████████████ 100% ✅
Frontend:    ████░░░░░░░░░░░░░░░░  20% ⏳
PDF Gen:     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Testing:     ████░░░░░░░░░░░░░░░░  20% ⏳
Overall:     ████████░░░░░░░░░░░░  40% 🚧
```

## 🎯 Next Steps

1. **Enhance CMRSignature.jsx** (2-3 hours)
   - Add multi-stop detection
   - Implement sequential flow
   - Add photo capture

2. **Test thoroughly** (1 hour)
   - All 4 scenarios
   - Edge cases
   - Error handling

3. **PDF Generator** (2 hours)
   - Combine all CMRs
   - Insert photos
   - Send to customer

4. **Final testing** (1 hour)
   - End-to-end workflow
   - Production deployment

## 📝 Notes

- Backend is production-ready
- All API endpoints tested and working
- Smart signature sharing implemented
- Recipient check (name + address) working
- Database schema complete
- Migration executed successfully

**Estimated time to complete:** 6-7 hours
**Priority:** High (feature not usable without frontend)
