# 📊 Google Analytics Setup - Anleitung

## 🎯 SCHRITT 1: GOOGLE ANALYTICS ACCOUNT ERSTELLEN

### **1. Zu Google Analytics gehen:**
```
URL: https://analytics.google.com
Klicke auf: "Messung starten"
```

### **2. Account erstellen:**
```
Account-Name: Courierly
Land: Deutschland
Datenfreigabe: Nach Wunsch (empfohlen: alle aktivieren)
```

### **3. Property erstellen:**
```
Property-Name: Courierly Website
Zeitzone: (GMT+01:00) Berlin
Währung: Euro (EUR)
```

### **4. Datenstream hinzufügen:**
```
Plattform: Web
Website-URL: https://courierly.de
Stream-Name: Courierly Production
```

### **5. Mess-ID kopieren:**
```
Format: G-XXXXXXXXXX
Beispiel: G-1A2B3C4D5E
```

---

## 🔧 SCHRITT 2: MESS-ID IN CODE EINFÜGEN

### **Datei öffnen:**
```
client/src/components/GoogleAnalytics.jsx
```

### **Zeile 6 ändern:**
```javascript
// VORHER:
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// NACHHER (mit deiner echten ID):
const GA_MEASUREMENT_ID = 'G-1A2B3C4D5E';
```

---

## 🚀 SCHRITT 3: KOMPONENTE EINBINDEN

### **Datei öffnen:**
```
client/src/App.jsx
```

### **Import hinzufügen (oben):**
```javascript
import { GoogleAnalytics } from './components/GoogleAnalytics';
```

### **Komponente einfügen (im Return):**
```javascript
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          {/* Google Analytics */}
          <GoogleAnalytics />
          
          {/* Rest der App */}
          <Routes>
            ...
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
```

---

## 📊 SCHRITT 4: EVENT TRACKING EINBAUEN

### **A) Registrierung tracken:**

**Datei:** `client/src/pages/Register.jsx`

```javascript
// Import hinzufügen
import { trackRegistration } from '../components/GoogleAnalytics';

// In handleSubmit nach erfolgreicher Registrierung:
try {
  const response = await register(registerData);
  
  // Event tracken
  trackRegistration('email');
  
  setSuccess(true);
  ...
}
```

### **B) Login tracken:**

**Datei:** `client/src/pages/Login.jsx`

```javascript
// Import hinzufügen
import { trackLogin } from '../components/GoogleAnalytics';

// In handleSubmit nach erfolgreichem Login:
try {
  await login(email, password);
  
  // Event tracken
  trackLogin('email');
  
  navigate('/dashboard');
  ...
}
```

### **C) Auftrag erstellen tracken:**

**Datei:** `client/src/components/CreateOrderModal.jsx`

```javascript
// Import hinzufügen
import { trackOrderCreated } from '../components/GoogleAnalytics';

// Nach erfolgreichem Auftrag:
const response = await axios.post('/api/orders', orderData);

// Event tracken
trackOrderCreated(orderData.price, response.data.order.id);
```

### **D) Preisberechnung tracken:**

**Datei:** `client/src/pages/LandingPage.jsx` (im Preiskalkulator)

```javascript
// Import hinzufügen
import { trackPriceCalculation } from '../components/GoogleAnalytics';

// Nach Preisberechnung:
const calculatePrice = async () => {
  // ... Berechnung ...
  
  // Event tracken
  trackPriceCalculation(distance, calculatedPrice);
};
```

---

## ✅ SCHRITT 5: TESTEN

### **1. Lokaler Test:**
```bash
npm run dev
```

### **2. Browser Console öffnen:**
```
F12 oder Rechtsklick → "Untersuchen"
Tab: "Console"
```

### **3. Erwartete Ausgaben:**
```
✅ Google Analytics geladen
📊 Page View: /
📊 Event: calculate_price { distance_km: 100, calculated_price: 250 }
📊 Event: sign_up { method: 'email' }
```

### **4. In Google Analytics prüfen:**
```
1. Gehe zu: https://analytics.google.com
2. Klicke auf: "Berichte" → "Echtzeit"
3. Sollte 1 aktiver Nutzer angezeigt werden (du!)
4. Navigiere auf der Website → Sollte in Echtzeit erscheinen
```

---

## 📈 SCHRITT 6: WICHTIGE BERICHTE

### **A) Echtzeit:**
```
Berichte → Echtzeit
- Aktive Nutzer jetzt
- Seitenaufrufe
- Events
- Conversions
```

### **B) Akquisition:**
```
Berichte → Akquisition → Traffic-Akquisition
- Woher kommen die Besucher?
- Organic Search (Google)
- Direct (direkte Eingabe)
- Referral (andere Websites)
- Social (Social Media)
```

### **C) Engagement:**
```
Berichte → Engagement → Seiten und Bildschirme
- Welche Seiten werden besucht?
- Wie lange bleiben User?
- Bounce Rate
```

### **D) Conversions:**
```
Berichte → Conversions → Events
- sign_up (Registrierungen)
- login (Logins)
- create_order (Aufträge)
- calculate_price (Preisberechnungen)
```

---

## 🎯 SCHRITT 7: CONVERSION-ZIELE EINRICHTEN

### **1. Zu Admin gehen:**
```
Zahnrad unten links → Admin
```

### **2. Conversion-Events markieren:**
```
Property → Events
Finde Event: "sign_up"
Klicke auf: "Als Conversion markieren"

Wiederhole für:
- login
- create_order
- order_completed
```

### **3. Conversion-Werte:**
```
Event: create_order
Wert: Auftragspreis (wird automatisch getrackt)
```

---

## 📊 WICHTIGE METRIKEN

### **Traffic-Metriken:**
```
✅ Nutzer (Anzahl Besucher)
✅ Sitzungen (Anzahl Besuche)
✅ Seitenaufrufe
✅ Durchschnittliche Sitzungsdauer
✅ Seiten pro Sitzung
✅ Absprungrate (Bounce Rate)
```

### **Akquisitions-Metriken:**
```
✅ Organic Search (aus Google)
✅ Direct (direkte Eingabe)
✅ Referral (von anderen Websites)
✅ Social (aus Social Media)
✅ Paid Search (Google Ads)
```

### **Conversion-Metriken:**
```
✅ Registrierungen (sign_up)
✅ Logins (login)
✅ Aufträge (create_order)
✅ Conversion Rate
✅ Durchschnittlicher Auftragswert
```

---

## 🎯 ZIELE SETZEN

### **Monat 1:**
```
- 100 Nutzer
- 300 Sitzungen
- 10 Registrierungen
- 5 Aufträge
```

### **Monat 3:**
```
- 500 Nutzer
- 1500 Sitzungen
- 50 Registrierungen
- 25 Aufträge
```

### **Monat 6:**
```
- 2000 Nutzer
- 6000 Sitzungen
- 200 Registrierungen
- 100 Aufträge
```

### **Monat 12:**
```
- 5000 Nutzer
- 15000 Sitzungen
- 500 Registrierungen
- 250 Aufträge
```

---

## 🔍 TROUBLESHOOTING

### **Problem: Keine Daten in Analytics**
```
Lösung:
1. Prüfe Mess-ID in GoogleAnalytics.jsx
2. Prüfe Browser Console auf Fehler
3. Prüfe ob Ad-Blocker aktiv ist
4. Warte 24-48h (Daten können verzögert sein)
```

### **Problem: Events werden nicht getrackt**
```
Lösung:
1. Prüfe ob trackEvent() aufgerufen wird
2. Prüfe Browser Console auf Logs
3. Prüfe ob window.gtag existiert
4. Teste in Incognito-Modus
```

### **Problem: Echtzeit zeigt keine Daten**
```
Lösung:
1. Öffne Website in neuem Tab
2. Warte 10-30 Sekunden
3. Aktualisiere Analytics-Seite
4. Prüfe ob richtige Property ausgewählt
```

---

## ✅ CHECKLISTE

```
☐ Google Analytics Account erstellt
☐ Property erstellt
☐ Datenstream hinzugefügt
☐ Mess-ID kopiert
☐ Mess-ID in GoogleAnalytics.jsx eingefügt
☐ Komponente in App.jsx eingebunden
☐ Event Tracking in Register.jsx
☐ Event Tracking in Login.jsx
☐ Event Tracking in CreateOrderModal.jsx
☐ Event Tracking in Preiskalkulator
☐ Lokaler Test durchgeführt
☐ Echtzeit-Daten sichtbar
☐ Conversion-Events markiert
☐ Berichte geprüft
```

---

## 📞 SUPPORT

### **Google Analytics Hilfe:**
```
URL: https://support.google.com/analytics
```

### **Community:**
```
URL: https://www.en.advertisercommunity.com/t5/Google-Analytics/ct-p/Google_Analytics
```

---

**VIEL ERFOLG MIT GOOGLE ANALYTICS!** 📊✅🚀
