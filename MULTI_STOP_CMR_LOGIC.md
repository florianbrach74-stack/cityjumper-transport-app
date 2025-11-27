# 📋 Multi-Stop CMR System - Komplette Logik

## 🎯 Szenarien und Unterschriften

### **Szenario 1: Ein Absender → Mehrere Empfänger**
*Beispiel: Anwaltskanzlei → 5 Kündigungen an verschiedene Adressen*

**Unterschriften:**
- ✅ Absender unterschreibt **1x** (wird auf alle CMRs kopiert)
- ✅ Frachtführer unterschreibt **1x** (wird auf alle CMRs kopiert)
- ❌ Jeder Empfänger unterschreibt **separat**

**Fotos:**
- 📸 **Ein Foto pro Empfänger** (wenn nicht angetroffen)
- Jedes Foto gehört zu seinem CMR

---

### **Szenario 2: Mehrere Absender → Mehrere Empfänger**
*Beispiel: 3 Abholungen → 3 Zustellungen*

**Unterschriften:**
- ❌ Jeder Absender unterschreibt **separat**
- ✅ Frachtführer unterschreibt **1x** (wird auf alle CMRs kopiert)
- ❌ Jeder Empfänger unterschreibt **separat**

**Fotos:**
- 📸 Foto pro Abholung (wenn nötig)
- 📸 Foto pro Zustellung (wenn Empfänger nicht da)

---

### **Szenario 3: Ein Absender → Mehrere Sendungen zum SELBEN Empfänger**
*Beispiel: Firma → 5x Pakete zum selben Kunden (gleicher Name + gleiche Adresse)*

**Wichtig:** System prüft **Name UND Adresse**!

**Unterschriften:**
- ✅ Absender unterschreibt **1x** (wird auf alle CMRs kopiert)
- ✅ Frachtführer unterschreibt **1x** (wird auf alle CMRs kopiert)
- ✅ Empfänger unterschreibt **1x** (wird auf alle CMRs kopiert)

**Fotos:**
- **Empfänger zu Hause:** ✅ Unterschrift → ❌ **KEIN Foto**
- **Empfänger nicht da:** 📸 **EIN Foto für alle Sendungen** (Ablage vor Haustür)
- Das Foto wird an das Gesamt-PDF angehängt

**Edge Case - Gleiche Adresse, VERSCHIEDENE Namen:**
*Beispiel: 2 Kündigungen → Max Müller + Anna Müller (Ehefrau), gleiche Adresse*
```
❌ NICHT der gleiche Empfänger!
→ 2 separate CMRs
→ 2 separate Unterschriften ODER 2 separate Fotos
→ Foto 1: Kündigung für Max im Briefkasten
→ Foto 2: Kündigung für Anna im Briefkasten
```

---

### **Szenario 4: Mehrere Absender → EIN Empfänger**
*Beispiel: 3 Möbelhäuser → 1 Kunde*

**Unterschriften:**
- ❌ Jeder Absender unterschreibt **separat** (3 verschiedene Möbelhäuser)
- ✅ Frachtführer unterschreibt **1x** (wird auf alle CMRs kopiert)
- ✅ Empfänger unterschreibt **1x** (wird auf alle CMRs kopiert)

**Fotos:**
- 📸 Foto pro Abholung (Warenübergabe dokumentieren)
- **Empfänger zu Hause:** ✅ Unterschrift → ❌ **KEIN Foto bei Zustellung**
- **Empfänger nicht da:** 📸 **EIN Foto für alle Sendungen** (Ablage vor Haustür)

---

## 🔄 Workflow im Detail

### **Phase 1: Abholung(en)**

#### Bei EINEM Absender:
1. Fahrer kommt zur Abholadresse
2. Absender unterschreibt **einmal** auf dem Gerät
3. Unterschrift wird auf **alle CMRs** dieser Gruppe kopiert
4. Fahrer unterschreibt **einmal**
5. Unterschrift wird auf **alle CMRs** dieser Gruppe kopiert

#### Bei MEHREREN Absendern:
1. Fahrer kommt zur ersten Abholadresse
2. Absender 1 unterschreibt → **nur für seine CMRs**
3. 📸 Optional: Foto der Ware
4. Fahrer fährt zur zweiten Abholadresse
5. Absender 2 unterschreibt → **nur für seine CMRs**
6. 📸 Optional: Foto der Ware
7. Frachtführer unterschreibt **einmal am Ende** → auf **alle CMRs**

---

### **Phase 2: Zustellung(en)**

#### Bei EINEM Empfänger (mehrere Sendungen):
1. Fahrer kommt zur Zustelladresse
2. **Option A: Empfänger zu Hause**
   - Empfänger unterschreibt **einmal**
   - Unterschrift wird auf **alle CMRs** kopiert
   - ❌ **KEIN Foto nötig**
   - ✅ Fertig!

3. **Option B: Empfänger nicht da**
   - Fahrer wählt: "Ablage vor Haustür"
   - 📸 **EIN Foto** von allen Sendungen vor der Haustür
   - Foto wird an das Gesamt-PDF angehängt
   - ✅ Fertig!

#### Bei MEHREREN Empfängern:
1. Fahrer kommt zur ersten Zustelladresse
2. **Option A: Empfänger 1 zu Hause**
   - Empfänger 1 unterschreibt → **nur für sein CMR**
   - ❌ Kein Foto
   
3. **Option B: Empfänger 1 nicht da**
   - 📸 Foto von Sendung vor Haustür/Briefkasten
   - Foto gehört zu CMR #1

4. Button: "Weiter zu nächster Zustellung"
5. System zeigt automatisch nächsten Empfänger
6. Wiederholen für alle Empfänger

---

## 📄 PDF-Generierung

### **Bei EINEM Empfänger:**
```
Gesamt-PDF enthält:
├─ CMR #1 (Sendung 1)
├─ CMR #2 (Sendung 2)
├─ CMR #3 (Sendung 3)
└─ [Optional] EIN Foto (wenn Empfänger nicht da)
```

### **Bei MEHREREN Empfängern:**
```
Gesamt-PDF enthält:
├─ CMR #1 (Empfänger 1)
├─ [Optional] Foto Empfänger 1
├─ CMR #2 (Empfänger 2)
├─ [Optional] Foto Empfänger 2
├─ CMR #3 (Empfänger 3)
└─ [Optional] Foto Empfänger 3
```

**Format:** CMR → Foto → CMR → Foto → CMR → Foto

---

## 🗄️ Datenbank-Struktur

### **Felder in `cmr_documents`:**

```sql
-- Gruppierung
cmr_group_id VARCHAR(100)           -- z.B. "ORDER-123"
delivery_stop_index INTEGER         -- Position: 0, 1, 2, 3...
total_stops INTEGER                 -- Gesamtzahl der Stops

-- Signature Sharing Flags
can_share_sender_signature BOOLEAN  -- Kann Absender-Unterschrift geteilt werden?
can_share_receiver_signature BOOLEAN -- Kann Empfänger-Unterschrift geteilt werden?

-- Shared Signatures (wenn erlaubt)
shared_sender_signature TEXT        -- Geteilte Absender-Unterschrift
shared_carrier_signature TEXT       -- Geteilte Frachtführer-Unterschrift
shared_receiver_signature TEXT      -- Geteilte Empfänger-Unterschrift (NEU!)

-- Individual Signatures (wenn nicht geteilt)
sender_signature TEXT               -- Individuelle Absender-Unterschrift
receiver_signature TEXT             -- Individuelle Empfänger-Unterschrift

-- Fotos
delivery_photo_base64 TEXT          -- Foto bei Zustellung (wenn Empfänger nicht da)
shared_delivery_photo_base64 TEXT   -- EIN Foto für alle CMRs (bei gleichem Empfänger)
```

---

## 🎨 Frontend-Flow

### **Fahrer-App: Zustellung bei EINEM Empfänger**

```
┌─────────────────────────────────────┐
│ 📦 Zustellung 1-5 von 5             │
│                                     │
│ Empfänger: Max Mustermann          │
│ Adresse: Hauptstraße 1              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 5 Sendungen für diesen Empfänger│ │
│ └─────────────────────────────────┘ │
│                                     │
│ Empfänger angetroffen?              │
│                                     │
│ ┌─────────────┐  ┌────────────────┐│
│ │ ✅ Ja       │  │ ❌ Nicht da    ││
│ │ Unterschrift│  │ Foto machen    ││
│ └─────────────┘  └────────────────┘│
└─────────────────────────────────────┘
```

**Wenn "Ja":**
- Unterschrift-Pad öffnen
- Empfänger unterschreibt einmal
- Unterschrift wird auf alle 5 CMRs kopiert
- ✅ Fertig!

**Wenn "Nicht da":**
- Kamera öffnen
- Foto von allen Sendungen vor Haustür
- Foto wird an Gesamt-PDF angehängt
- ✅ Fertig!

---

## 🔍 Entscheidungslogik im Code

```javascript
// Helper: Prüfe ob alle Zustellungen zum SELBEN EMPFÄNGER gehen
const checkSameDeliveryRecipient = (order, deliveryStops) => {
  const mainRecipient = {
    name: (order.delivery_contact_name || order.delivery_company || '')?.toLowerCase().trim(),
    address: order.delivery_address?.toLowerCase().trim(),
    city: order.delivery_city?.toLowerCase().trim(),
    postal_code: order.delivery_postal_code?.toLowerCase().trim()
  };
  
  // Prüfe Name UND Adresse!
  return deliveryStops.every(stop => {
    const stopName = (stop.contact_name || stop.company || '')?.toLowerCase().trim();
    return stopName === mainRecipient.name &&
           stop.address?.toLowerCase().trim() === mainRecipient.address &&
           stop.city?.toLowerCase().trim() === mainRecipient.city &&
           stop.postal_code?.toLowerCase().trim() === mainRecipient.postal_code;
  });
};

// Prüfe ob Empfänger-Unterschrift geteilt werden kann
const canShareReceiverSignature = 
  // Mehrere Zustellungen zum SELBEN EMPFÄNGER (Name + Adresse!)
  (hasMultipleDeliveries && sameDeliveryRecipient) ||
  // Mehrere Abholungen, aber nur eine Zustellung
  (hasMultiplePickups && !hasMultipleDeliveries);

// Prüfe ob Foto geteilt werden kann
const canShareDeliveryPhoto = canShareReceiverSignature;

// Wenn Empfänger-Unterschrift geteilt werden kann:
if (canShareReceiverSignature) {
  // Option 1: Empfänger unterschreibt
  // → shared_receiver_signature auf alle CMRs
  // → KEIN Foto
  
  // Option 2: Empfänger nicht da
  // → shared_delivery_photo_base64 auf alle CMRs
  // → KEINE Unterschrift
}
```

### **Wichtig: Name + Adresse = Empfänger**

```javascript
// ✅ GLEICHER Empfänger:
Empfänger 1: "Max Müller", "Hauptstraße 1", "10115", "Berlin"
Empfänger 2: "Max Müller", "Hauptstraße 1", "10115", "Berlin"
→ Kann Unterschrift teilen!

// ❌ VERSCHIEDENE Empfänger (trotz gleicher Adresse):
Empfänger 1: "Max Müller", "Hauptstraße 1", "10115", "Berlin"
Empfänger 2: "Anna Müller", "Hauptstraße 1", "10115", "Berlin"
→ Separate Unterschriften/Fotos!
```

---

## 📊 Beispiel-Daten

### **Auftrag #123: Anwaltskanzlei → 5 Kündigungen**

```javascript
CMR-Gruppe: "ORDER-123"

CMR #25000066 (Stop 0/5):
  sender_signature: null (verwendet shared)
  shared_sender_signature: "data:image/png;base64,..." ✅
  shared_carrier_signature: "data:image/png;base64,..." ✅
  receiver_signature: "data:image/png;base64,..." (individuell)
  delivery_photo_base64: "data:image/png;base64,..." (wenn nicht da)
  can_share_sender_signature: true
  can_share_receiver_signature: false

CMR #25000067 (Stop 1/5):
  sender_signature: null (verwendet shared)
  shared_sender_signature: "data:image/png;base64,..." ✅
  shared_carrier_signature: "data:image/png;base64,..." ✅
  receiver_signature: "data:image/png;base64,..." (individuell)
  delivery_photo_base64: "data:image/png;base64,..." (wenn nicht da)
  can_share_sender_signature: true
  can_share_receiver_signature: false
```

### **Auftrag #124: 3 Möbelhäuser → 1 Kunde**

```javascript
CMR-Gruppe: "ORDER-124"

CMR #25000068 (Stop 0/3 - Möbelhaus 1):
  sender_signature: "data:image/png;base64,..." (individuell)
  shared_carrier_signature: "data:image/png;base64,..." ✅
  receiver_signature: null (verwendet shared)
  shared_receiver_signature: "data:image/png;base64,..." ✅
  shared_delivery_photo_base64: "data:image/png;base64,..." (wenn nicht da)
  can_share_sender_signature: false
  can_share_receiver_signature: true

CMR #25000069 (Stop 1/3 - Möbelhaus 2):
  sender_signature: "data:image/png;base64,..." (individuell)
  shared_carrier_signature: "data:image/png;base64,..." ✅
  receiver_signature: null (verwendet shared)
  shared_receiver_signature: "data:image/png;base64,..." ✅
  shared_delivery_photo_base64: "data:image/png;base64,..." (wenn nicht da)
  can_share_sender_signature: false
  can_share_receiver_signature: true
```

---

## ✅ Zusammenfassung

### **Unterschriften:**
- Absender: Geteilt wenn **ein** Absender ODER **gleiche** Abholadresse
- Frachtführer: **Immer** geteilt
- Empfänger: Geteilt wenn **ein** Empfänger ODER **gleiche** Zustelladresse

### **Fotos:**
- **Mehrere Empfänger:** Ein Foto pro Empfänger (wenn nicht da)
- **Ein Empfänger:** EIN Foto für alle Sendungen (wenn nicht da)
- **Empfänger zu Hause:** KEIN Foto (Unterschrift reicht)

### **PDF:**
- **Ein Empfänger:** Alle CMRs + optional EIN Foto am Ende
- **Mehrere Empfänger:** CMR → Foto → CMR → Foto → ...

---

**Status:** Phase 1 implementiert (Datenbank + Backend-Logik)  
**Nächste Schritte:** Phase 2 (API-Endpoints + Frontend)
