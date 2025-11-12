# 🔄 DUAL-ROLE IMPLEMENTATION: Auftragnehmer + Kunde

## 📋 ANFORDERUNG

**Ziel:** Auftragnehmer sollen auch als Kunden agieren können, um eigene Aufträge einzustellen, wenn sie diese nicht selbst erledigen können.

**Beispiel-Szenario:**
1. Max ist Auftragnehmer bei Courierly
2. Max bekommt einen großen Auftrag, den er alleine nicht schaffen kann
3. Max wechselt in den "Kunden-Modus"
4. Max erstellt einen neuen Auftrag als Kunde
5. Andere Auftragnehmer können diesen Auftrag annehmen
6. Max wechselt zurück in den "Auftragnehmer-Modus"

---

## 🎯 LÖSUNGSANSATZ

### **Option 1: Role-Switching (EMPFOHLEN)**

**Konzept:**
- Auftragnehmer haben BEIDE Rollen: `contractor` + `customer`
- User kann zwischen Rollen wechseln
- Ein Toggle-Button im Dashboard: "Als Kunde agieren" / "Als Auftragnehmer agieren"
- Aktueller Modus wird in Session/State gespeichert

**Vorteile:**
- ✅ Einfache Implementierung
- ✅ Klare Trennung der Funktionen
- ✅ Keine Datenbank-Änderungen nötig
- ✅ User behält beide Identitäten
- ✅ Einfach zu verstehen für User

**Nachteile:**
- ⚠️ User muss manuell wechseln
- ⚠️ Könnte verwirrend sein (aber mit gutem UI lösbar)

---

### **Option 2: Automatische Dual-Role**

**Konzept:**
- Auftragnehmer haben automatisch auch Kunden-Rechte
- Dashboard zeigt beide Bereiche gleichzeitig
- Tabs: "Meine Aufträge (Auftragnehmer)" | "Meine Bestellungen (Kunde)"

**Vorteile:**
- ✅ Kein Wechseln nötig
- ✅ Alles auf einen Blick

**Nachteile:**
- ⚠️ Komplexeres UI
- ⚠️ Könnte überladen wirken
- ⚠️ Mehr Code-Änderungen

---

### **Option 3: Separate Accounts**

**Konzept:**
- Auftragnehmer erstellt separaten Kunden-Account
- Zwei verschiedene Logins

**Vorteile:**
- ✅ Klare Trennung

**Nachteile:**
- ❌ Umständlich
- ❌ Zwei Logins merken
- ❌ Schlechte UX
- ❌ NICHT EMPFOHLEN

---

## 🚀 EMPFOHLENE LÖSUNG: OPTION 1 (Role-Switching)

### **Implementierungs-Plan:**

---

## 📊 DATENBANK-ÄNDERUNGEN

### **1. User-Tabelle erweitern**

**Aktuell:**
```sql
users (
  id,
  email,
  password_hash,
  role,  -- 'customer', 'contractor', 'employee', 'admin'
  ...
)
```

**NEU:**
```sql
users (
  id,
  email,
  password_hash,
  primary_role,      -- Hauptrolle: 'contractor', 'customer', 'employee', 'admin'
  secondary_roles,   -- JSON Array: ['customer', 'contractor']
  active_role,       -- Aktuell aktive Rolle für Session
  ...
)
```

**Migration:**
```sql
-- Migration: Add dual-role support
ALTER TABLE users ADD COLUMN primary_role VARCHAR(50);
ALTER TABLE users ADD COLUMN secondary_roles JSON;
ALTER TABLE users ADD COLUMN active_role VARCHAR(50);

-- Migrate existing data
UPDATE users SET primary_role = role;
UPDATE users SET active_role = role;

-- Contractors get customer role automatically
UPDATE users 
SET secondary_roles = JSON_ARRAY('customer', 'contractor')
WHERE role = 'contractor';

-- Customers stay customers only
UPDATE users 
SET secondary_roles = JSON_ARRAY('customer')
WHERE role = 'customer';
```

---

## 🎨 UI/UX ÄNDERUNGEN

### **1. Role-Switcher Component**

**Position:** Oben rechts in der Navbar (neben User-Info)

**Design:**
```jsx
<RoleSwitcher>
  {user.secondary_roles.includes('contractor') && user.secondary_roles.includes('customer') && (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
      <button 
        className={activeRole === 'contractor' ? 'active' : ''}
        onClick={() => switchRole('contractor')}
      >
        <Truck /> Auftragnehmer
      </button>
      <button 
        className={activeRole === 'customer' ? 'active' : ''}
        onClick={() => switchRole('customer')}
      >
        <User /> Kunde
      </button>
    </div>
  )}
</RoleSwitcher>
```

**Visualisierung:**
```
┌─────────────────────────────────────────────────┐
│  [Logo]  Startseite  Dashboard                 │
│                                                  │
│  ┌──────────────────┐  [Florian Brach]  [⚙️]   │
│  │ 🚚 Auftragnehmer │                           │
│  │ 👤 Kunde         │  [Abmelden]               │
│  └──────────────────┘                           │
└─────────────────────────────────────────────────┘
```

---

### **2. Dashboard-Anpassungen**

**Contractor Dashboard (wenn active_role = 'contractor'):**
```
┌─────────────────────────────────────────┐
│  Auftragnehmer Dashboard                │
├─────────────────────────────────────────┤
│  📦 Verfügbare Aufträge                 │
│  ✅ Meine angenommenen Aufträge         │
│  💰 Verdienste                          │
│  📊 Statistiken                         │
│                                          │
│  💡 Tipp: Zu viel zu tun?               │
│  → Wechseln Sie zu "Kunde" und          │
│     stellen Sie einen Auftrag ein!      │
└─────────────────────────────────────────┘
```

**Customer Dashboard (wenn active_role = 'customer'):**
```
┌─────────────────────────────────────────┐
│  Kunden Dashboard                       │
├─────────────────────────────────────────┤
│  ➕ Neuer Auftrag                       │
│  📋 Meine Bestellungen                  │
│  💳 Rechnungen                          │
│  📍 Gespeicherte Adressen               │
└─────────────────────────────────────────┘
```

---

## 💻 CODE-ÄNDERUNGEN

### **1. AuthContext erweitern**

**Datei:** `client/src/context/AuthContext.jsx`

```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);

  // Rolle wechseln
  const switchRole = async (newRole) => {
    if (!user.secondary_roles.includes(newRole)) {
      throw new Error('User does not have this role');
    }

    try {
      // Backend-Call um active_role zu aktualisieren
      const response = await api.post('/auth/switch-role', { role: newRole });
      
      setActiveRole(newRole);
      setUser({ ...user, active_role: newRole });
      
      // LocalStorage aktualisieren
      localStorage.setItem('user', JSON.stringify({ ...user, active_role: newRole }));
      
      return response.data;
    } catch (error) {
      console.error('Role switch failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    activeRole,
    switchRole,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

### **2. Backend-Endpunkt**

**Datei:** `server/routes/auth.js`

```javascript
// POST /api/auth/switch-role
router.post('/switch-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    // User aus DB holen
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    // Prüfen ob User diese Rolle hat
    const secondaryRoles = user.rows[0].secondary_roles || [];
    if (!secondaryRoles.includes(role)) {
      return res.status(403).json({ error: 'User does not have this role' });
    }

    // active_role aktualisieren
    await db.query(
      'UPDATE users SET active_role = $1 WHERE id = $2',
      [role, userId]
    );

    res.json({ 
      message: 'Role switched successfully',
      active_role: role 
    });
  } catch (error) {
    console.error('Role switch error:', error);
    res.status(500).json({ error: 'Failed to switch role' });
  }
});
```

---

### **3. RoleSwitcher Component**

**Datei:** `client/src/components/RoleSwitcher.jsx`

```javascript
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, User, Loader } from 'lucide-react';

export default function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuth();
  const [loading, setLoading] = useState(false);

  // Nur anzeigen wenn User beide Rollen hat
  if (!user?.secondary_roles?.includes('contractor') || 
      !user?.secondary_roles?.includes('customer')) {
    return null;
  }

  const handleSwitch = async (newRole) => {
    if (newRole === activeRole) return;

    setLoading(true);
    try {
      await switchRole(newRole);
      // Optional: Toast-Nachricht
      toast.success(`Gewechselt zu ${newRole === 'contractor' ? 'Auftragnehmer' : 'Kunde'}`);
    } catch (error) {
      toast.error('Fehler beim Wechseln der Rolle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleSwitch('contractor')}
        disabled={loading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
          activeRole === 'contractor'
            ? 'bg-primary-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        {loading && activeRole !== 'contractor' ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Truck className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">Auftragnehmer</span>
      </button>

      <button
        onClick={() => handleSwitch('customer')}
        disabled={loading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
          activeRole === 'customer'
            ? 'bg-primary-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        {loading && activeRole !== 'customer' ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">Kunde</span>
      </button>
    </div>
  );
}
```

---

### **4. Dashboard-Router anpassen**

**Datei:** `client/src/App.jsx`

```javascript
const DashboardRouter = () => {
  const { user, activeRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin hat immer Admin-Dashboard
  if (user.primary_role === 'admin') {
    return <AdminDashboard />;
  }

  // Employee hat immer Employee-Dashboard
  if (user.primary_role === 'employee') {
    return <EmployeeDashboard />;
  }

  // Dual-Role User: Zeige Dashboard basierend auf active_role
  if (activeRole === 'customer' || user.primary_role === 'customer') {
    return <CustomerDashboard />;
  }

  if (activeRole === 'contractor' || user.primary_role === 'contractor') {
    return <ContractorDashboard />;
  }

  // Fallback
  return <Navigate to="/" replace />;
};
```

---

## 🔐 SICHERHEIT & VALIDIERUNG

### **Backend-Checks:**

```javascript
// Bei jeder API-Anfrage prüfen
const checkRolePermission = (req, res, next) => {
  const { active_role } = req.user;
  const requiredRole = req.route.meta?.requiredRole;

  if (requiredRole && active_role !== requiredRole) {
    return res.status(403).json({ 
      error: 'Insufficient permissions for current role' 
    });
  }

  next();
};

// Beispiel: Nur Kunden können Aufträge erstellen
router.post('/orders', authenticateToken, checkRolePermission, async (req, res) => {
  // Route meta: { requiredRole: 'customer' }
  // ...
});

// Beispiel: Nur Auftragnehmer können Aufträge annehmen
router.post('/orders/:id/accept', authenticateToken, checkRolePermission, async (req, res) => {
  // Route meta: { requiredRole: 'contractor' }
  // ...
});
```

---

## 📝 REGISTRIERUNGS-PROZESS

### **Für neue Auftragnehmer:**

**Option A: Automatisch beide Rollen**
```javascript
// Bei Registrierung als Contractor
const newUser = {
  email,
  password_hash,
  primary_role: 'contractor',
  secondary_roles: ['contractor', 'customer'],  // Automatisch beide
  active_role: 'contractor'
};
```

**Option B: Opt-in während Registrierung**
```jsx
<Register>
  {role === 'contractor' && (
    <Checkbox>
      Ich möchte auch als Kunde Aufträge einstellen können
    </Checkbox>
  )}
</Register>
```

**Option C: Später aktivieren**
```jsx
<Settings>
  <button onClick={enableCustomerRole}>
    Kunden-Funktion aktivieren
  </button>
</Settings>
```

---

## 🧪 TESTING-SZENARIEN

### **Test 1: Role-Switch**
1. Login als Contractor
2. Dashboard zeigt Contractor-Ansicht
3. Klick auf "Kunde" Button
4. Dashboard wechselt zu Customer-Ansicht
5. Neuer Auftrag kann erstellt werden
6. Klick auf "Auftragnehmer" Button
7. Dashboard wechselt zurück

### **Test 2: Order Creation als Contractor-Customer**
1. Login als Contractor
2. Wechsel zu "Kunde"
3. Erstelle neuen Auftrag
4. Auftrag erscheint in "Verfügbare Aufträge"
5. Wechsel zu "Auftragnehmer"
6. Eigener Auftrag wird NICHT in "Verfügbare Aufträge" angezeigt (Konflikt vermeiden)

### **Test 3: Permissions**
1. Versuche als Customer Aufträge anzunehmen → Fehler
2. Versuche als Contractor Aufträge zu erstellen → Fehler (muss zu Customer wechseln)

---

## 📊 DATEN-INTEGRITÄT

### **Wichtige Regeln:**

1. **Eigene Aufträge nicht annehmen:**
```javascript
// Backend: Beim Abrufen verfügbarer Aufträge
const availableOrders = await db.query(`
  SELECT * FROM orders 
  WHERE status = 'pending' 
  AND customer_id != $1  -- Nicht eigene Aufträge
  ORDER BY created_at DESC
`, [userId]);
```

2. **Rollen-Konsistenz:**
```javascript
// Sicherstellen dass active_role in secondary_roles enthalten ist
if (!user.secondary_roles.includes(user.active_role)) {
  // Reset to primary_role
  user.active_role = user.primary_role;
}
```

3. **Audit-Log:**
```sql
-- Tabelle für Role-Switches
CREATE TABLE role_switches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  from_role VARCHAR(50),
  to_role VARCHAR(50),
  switched_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 IMPLEMENTIERUNGS-REIHENFOLGE

### **Phase 1: Datenbank (30 Min)**
1. ✅ Migration erstellen
2. ✅ Bestehende Daten migrieren
3. ✅ Testen

### **Phase 2: Backend (1 Stunde)**
1. ✅ `/auth/switch-role` Endpunkt
2. ✅ Permission-Middleware
3. ✅ Order-Queries anpassen
4. ✅ Testen

### **Phase 3: Frontend (2 Stunden)**
1. ✅ AuthContext erweitern
2. ✅ RoleSwitcher Component
3. ✅ Dashboard-Router anpassen
4. ✅ Navbar integrieren
5. ✅ Testen

### **Phase 4: Testing & Bugfixes (1 Stunde)**
1. ✅ End-to-End Tests
2. ✅ Edge Cases
3. ✅ UI/UX Feinschliff

**Gesamt-Aufwand: ~4-5 Stunden**

---

## 💡 ZUSÄTZLICHE FEATURES (Optional)

### **1. Automatischer Hinweis**
```jsx
<ContractorDashboard>
  {orders.length > 10 && (
    <Alert>
      💡 Zu viele Aufträge? 
      <button onClick={() => switchRole('customer')}>
        Als Kunde einen Auftrag einstellen
      </button>
    </Alert>
  )}
</ContractorDashboard>
```

### **2. Statistiken**
```jsx
<Dashboard>
  <Stats>
    Als Auftragnehmer: {contractorOrders} Aufträge erledigt
    Als Kunde: {customerOrders} Aufträge beauftragt
  </Stats>
</Dashboard>
```

### **3. Benachrichtigungen**
```javascript
// Wenn eigener Auftrag (als Kunde erstellt) angenommen wurde
notify('Ihr Auftrag wurde von Max Mustermann angenommen!');
```

---

## ✅ CHECKLISTE

- [ ] Datenbank-Migration erstellen
- [ ] Backend-Endpunkt `/auth/switch-role`
- [ ] Permission-Middleware
- [ ] AuthContext erweitern
- [ ] RoleSwitcher Component
- [ ] Dashboard-Router anpassen
- [ ] Navbar Integration
- [ ] Order-Queries anpassen (keine eigenen Aufträge)
- [ ] Registrierungs-Prozess anpassen
- [ ] Testing (Unit + E2E)
- [ ] Dokumentation aktualisieren
- [ ] User-Guide erstellen

---

**Geschätzte Implementierungszeit: 4-5 Stunden**
**Komplexität: Mittel**
**Risiko: Niedrig**

**Bereit für morgen!** 🚀
