# 📧 Email-Verifizierung - Implementierungs-Plan

## ✅ Was bereits erstellt wurde:

1. **Datenbank-Migration** (`migrations/add-email-verification.sql`)
   - Neue Spalten: `email_verified`, `email_verification_code`, etc.
   - Bestehende Benutzer werden als verifiziert markiert

2. **Email-Service** (`server/services/emailVerificationService.js`)
   - Generiert 6-stelligen Code
   - Sendet Verifizierungs-Email
   - Verifiziert Code
   - Resend-Funktion

3. **API-Endpunkte** (`server/routes/auth.js`)
   - `POST /api/auth/verify-email` - Code verifizieren
   - `POST /api/auth/resend-verification` - Neuen Code anfordern

---

## 🚧 Was noch zu tun ist:

### 1. Auth-Controller anpassen
**Datei:** `server/controllers/authController.js`

```javascript
// In register-Funktion nach User-Erstellung:
const { sendVerificationEmail } = require('../services/emailVerificationService');

// Nach: const user = await User.create(...)
await sendVerificationEmail(user.id, user.email, user.first_name);

// Response anpassen:
res.status(201).json({
  message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihre Emails.',
  requiresVerification: true,
  email: user.email,
  // KEIN TOKEN - erst nach Verifizierung
});
```

### 2. Login-Prüfung erweitern
**Datei:** `server/controllers/authController.js`

```javascript
// In login-Funktion nach Passwort-Check:
if (!user.email_verified) {
  return res.status(403).json({ 
    error: 'Email nicht verifiziert',
    requiresVerification: true,
    email: user.email
  });
}
```

### 3. Registrierungs-Validierung verschärfen
**Datei:** `server/controllers/authController.js`

```javascript
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['customer', 'contractor', 'employee']),
  body('first_name').notEmpty().withMessage('Vorname ist erforderlich'),
  body('last_name').notEmpty().withMessage('Nachname ist erforderlich'),
  body('phone').notEmpty().withMessage('Telefon ist erforderlich'), // NEU!
  // Wenn Geschäftskunde (company_name angegeben):
  body('company_name').custom((value, { req }) => {
    if (value && value.trim().length > 0) {
      // Firmenname wurde angegeben - ist OK
      return true;
    }
    // Kein Firmenname - auch OK (Privatkunde)
    return true;
  })
];
```

### 4. Frontend: Verifizierungs-Seite
**Neue Datei:** `client/src/pages/VerifyEmail.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-email', { email, code });
      alert('Email erfolgreich verifiziert! Sie können sich jetzt anmelden.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Verifizierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-verification', { email });
      alert('Neuer Code wurde gesendet!');
    } catch (err) {
      alert('Fehler beim Senden: ' + err.response?.data?.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Email verifizieren</h2>
        <p className="text-gray-600 mb-6">
          Wir haben einen 6-stelligen Code an <strong>{email}</strong> gesendet.
        </p>
        
        <form onSubmit={handleVerify}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
          )}
          
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-stelliger Code"
            className="w-full px-4 py-2 border rounded mb-4 text-center text-2xl tracking-widest"
            maxLength="6"
            required
          />
          
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Wird verifiziert...' : 'Verifizieren'}
          </button>
        </form>
        
        <button
          onClick={handleResend}
          className="w-full mt-4 text-primary-600 hover:underline"
        >
          Code erneut senden
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
```

### 5. Register.jsx anpassen
**Datei:** `client/src/pages/Register.jsx`

```javascript
// Telefon als Pflichtfeld:
<input
  id="phone"
  name="phone"
  type="tel"
  required  // NEU!
  value={formData.phone}
  onChange={handleChange}
  className="..."
/>

// Nach erfolgreicher Registrierung:
try {
  const { confirmPassword, ...registerData } = formData;
  const response = await register(registerData);
  
  if (response.requiresVerification) {
    // Zur Verifizierungs-Seite
    navigate('/verify-email', { state: { email: formData.email } });
  } else {
    // Direkt zum Dashboard (sollte nicht passieren)
    navigate('/dashboard');
  }
} catch (err) {
  // ...
}
```

### 6. App.jsx - Route hinzufügen
**Datei:** `client/src/App.jsx`

```javascript
import VerifyEmail from './pages/VerifyEmail';

<Route path="/verify-email" element={<VerifyEmail />} />
```

### 7. Admin-Dashboard: Kontaktdaten anzeigen
**Datei:** `client/src/components/CustomerManagement.jsx`

Füge Spalten hinzu:
- Telefon
- Firmenname
- Email-Verifiziert Status

---

## 🔧 Migration ausführen:

```bash
node run-email-verification-migration.js
```

Oder manuell in Railway PostgreSQL:
```sql
-- Siehe migrations/add-email-verification.sql
```

---

## ✅ Vorteile:

1. **Bot-Schutz:** Email-Verifizierung verhindert Spam-Registrierungen
2. **Kontaktdaten:** Telefon ist Pflicht für Kundenkontakt
3. **Sicherheit:** Nur verifizierte Benutzer können sich einloggen
4. **Compliance:** DSGVO-konform durch Opt-in

---

## 📝 Hinweise:

- Bestehende Benutzer werden automatisch als verifiziert markiert
- Code ist 15 Minuten gültig
- Neuer Code kann jederzeit angefordert werden
- Email-Template ist professionell gestaltet

---

**Status:** Teilweise implementiert - Backend fertig, Frontend TODO
**Nächster Schritt:** Frontend-Komponenten erstellen
