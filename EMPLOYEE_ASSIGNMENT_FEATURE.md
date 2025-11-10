# 👥 Mitarbeiter-Zuweisungssystem

## Übersicht

Auftragnehmer können wählen, wie ihre Mitarbeiter Zugriff auf Aufträge erhalten:
- **Alle Mitarbeiter sehen alle Aufträge** (Standard)
- **Aufträge müssen einzeln zugewiesen werden**

---

## 🎯 Features

### 1. Auftragnehmer-Einstellungen

**Endpoint:** `GET/PUT /api/employee-assignment/settings`

**Optionen:**
- `all_access` - Alle Mitarbeiter sehen alle Aufträge des Auftragnehmers
- `manual_assignment` - Aufträge müssen einzeln an Mitarbeiter zugewiesen werden

**Beispiel Request:**
```json
PUT /api/employee-assignment/settings
{
  "assignmentMode": "manual_assignment"
}
```

**Response:**
```json
{
  "message": "Einstellungen aktualisiert",
  "assignmentMode": "manual_assignment"
}
```

---

### 2. Auftrag an Mitarbeiter zuweisen

**Endpoint:** `POST /api/employee-assignment/orders/:orderId/assign`

**Request:**
```json
{
  "employeeId": 123
}
```

**Response:**
```json
{
  "message": "Auftrag zugewiesen",
  "order": {
    "id": 456,
    "assigned_employee_id": 123,
    "employee_first_name": "Max",
    "employee_last_name": "Mustermann",
    "employee_email": "max@example.com",
    ...
  }
}
```

**Zuweisung entfernen:**
```json
{
  "employeeId": null
}
```

---

### 3. Aufträge mit Zuweisungen abrufen

**Endpoint:** `GET /api/employee-assignment/orders`

**Response:**
```json
[
  {
    "id": 456,
    "pickup_city": "Berlin",
    "delivery_city": "München",
    "assigned_employee_id": 123,
    "employee_first_name": "Max",
    "employee_last_name": "Mustermann",
    "employee_email": "max@example.com",
    ...
  }
]
```

---

### 4. Mitarbeiter-Ansicht

**Endpoint:** `GET /api/employee-assignment/employee/orders`

**Verhalten:**
- **all_access:** Mitarbeiter sieht alle Aufträge des Auftragnehmers
- **manual_assignment:** Mitarbeiter sieht nur zugewiesene Aufträge

**Response:**
```json
{
  "orders": [...],
  "assignmentMode": "manual_assignment"
}
```

---

### 5. Mitarbeiter-Liste

**Endpoint:** `GET /api/employee-assignment/employees`

**Response:**
```json
[
  {
    "id": 123,
    "first_name": "Max",
    "last_name": "Mustermann",
    "email": "max@example.com",
    "phone": "0172 123 4567"
  }
]
```

---

## 🔐 Berechtigungen

### Auftragnehmer (contractor)
- ✅ Einstellungen ändern
- ✅ Aufträge zuweisen
- ✅ Alle Aufträge sehen
- ✅ Mitarbeiter-Liste abrufen

### Mitarbeiter (employee)
- ✅ Eigene Aufträge sehen (abhängig von Einstellung)
- ❌ Keine Zuweisungen ändern
- ❌ Keine Einstellungen ändern

### Admin
- ✅ Sieht zugewiesenen Mitarbeiter bei jedem Auftrag
- ✅ Status zeigt "Zugewiesen an [Name]"

---

## 📊 Datenbank-Schema

### users Tabelle
```sql
employee_assignment_mode VARCHAR(50) DEFAULT 'all_access'
  CHECK (employee_assignment_mode IN ('all_access', 'manual_assignment'))
```

### transport_orders Tabelle
```sql
assigned_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL
```

---

## 🎨 Frontend-Integration

### Auftragnehmer-Dashboard

#### Einstellungen-Seite
```jsx
const [assignmentMode, setAssignmentMode] = useState('all_access');

// Load settings
useEffect(() => {
  fetch('/api/employee-assignment/settings')
    .then(res => res.json())
    .then(data => setAssignmentMode(data.assignmentMode));
}, []);

// Update settings
const updateSettings = async (mode) => {
  await fetch('/api/employee-assignment/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentMode: mode })
  });
  setAssignmentMode(mode);
};

return (
  <div>
    <h2>Mitarbeiter-Zugriff</h2>
    <select value={assignmentMode} onChange={(e) => updateSettings(e.target.value)}>
      <option value="all_access">Alle Mitarbeiter sehen alle Aufträge</option>
      <option value="manual_assignment">Aufträge einzeln zuweisen</option>
    </select>
  </div>
);
```

#### Auftrags-Zuweisung
```jsx
const AssignEmployeeButton = ({ orderId, currentEmployeeId }) => {
  const [employees, setEmployees] = useState([]);
  
  useEffect(() => {
    fetch('/api/employee-assignment/employees')
      .then(res => res.json())
      .then(setEmployees);
  }, []);
  
  const assignEmployee = async (employeeId) => {
    await fetch(`/api/employee-assignment/orders/${orderId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId })
    });
    // Refresh order list
  };
  
  return (
    <select 
      value={currentEmployeeId || ''} 
      onChange={(e) => assignEmployee(e.target.value || null)}
    >
      <option value="">Nicht zugewiesen</option>
      {employees.map(emp => (
        <option key={emp.id} value={emp.id}>
          {emp.first_name} {emp.last_name}
        </option>
      ))}
    </select>
  );
};
```

---

## 👨‍💼 Admin-Ansicht

### Auftrags-Liste mit Zuweisung

```jsx
const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders));
  }, []);
  
  return (
    <table>
      <thead>
        <tr>
          <th>Auftrag #</th>
          <th>Route</th>
          <th>Auftragnehmer</th>
          <th>Zugewiesen an</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{order.pickup_city} → {order.delivery_city}</td>
            <td>
              {order.contractor_company_name || 
               `${order.contractor_first_name} ${order.contractor_last_name}`}
            </td>
            <td>
              {order.assigned_employee_first_name ? (
                <span className="badge badge-info">
                  👤 {order.assigned_employee_first_name} {order.assigned_employee_last_name}
                </span>
              ) : (
                <span className="text-muted">Nicht zugewiesen</span>
              )}
            </td>
            <td>{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## 🔄 Workflow

### Szenario 1: Alle Mitarbeiter sehen alles (Standard)

1. Auftragnehmer aktiviert "Alle Mitarbeiter sehen alle Aufträge"
2. Auftragnehmer nimmt Auftrag an
3. **Alle** Mitarbeiter sehen den Auftrag sofort
4. Jeder Mitarbeiter kann den Auftrag bearbeiten
5. Admin sieht: "Auftragnehmer: [Firma]"

### Szenario 2: Manuelle Zuweisung

1. Auftragnehmer aktiviert "Aufträge einzeln zuweisen"
2. Auftragnehmer nimmt Auftrag an
3. Auftrag ist **nicht sichtbar** für Mitarbeiter
4. Auftragnehmer weist Auftrag an Mitarbeiter zu
5. **Nur** zugewiesener Mitarbeiter sieht den Auftrag
6. Admin sieht: "Zugewiesen an: Max Mustermann"

---

## ✅ Vorteile

### Für Auftragnehmer
- ✅ Flexible Kontrolle über Mitarbeiter-Zugriff
- ✅ Gezielte Zuweisung an qualifizierte Fahrer
- ✅ Bessere Organisation großer Teams
- ✅ Verhindert Verwirrung bei vielen Aufträgen

### Für Mitarbeiter
- ✅ Klare Zuständigkeiten
- ✅ Keine Überlastung durch zu viele Aufträge
- ✅ Fokus auf zugewiesene Aufgaben

### Für Admin
- ✅ Transparenz wer welchen Auftrag fährt
- ✅ Besserer Support bei Problemen
- ✅ Klare Verantwortlichkeiten

---

## 🚀 Deployment

### 1. Datenbank-Migration ausführen
```bash
psql $DATABASE_URL -f add_employee_assignment.sql
```

### 2. Backend deployen
```bash
git add .
git commit -m "feat: Add employee assignment system"
git push origin main
```

### 3. Frontend aktualisieren
- Einstellungs-Seite für Auftragnehmer
- Zuweisungs-Dropdown bei Aufträgen
- Admin-Ansicht mit Mitarbeiter-Info

---

## 📝 Nächste Schritte

1. ✅ Datenbank-Migration erstellt
2. ✅ Backend-Routes implementiert
3. ✅ Admin-Ansicht aktualisiert
4. ⏳ Frontend-Komponenten erstellen
5. ⏳ Testing
6. ⏳ Deployment

---

**Status:** Backend fertig, bereit für Frontend-Integration! 🎉
