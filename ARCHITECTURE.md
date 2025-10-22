# 🏗️ System-Architektur - ZipMend Transport Management

## 📐 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                         BENUTZER                                 │
│                    (Browser / Mobile)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                   Port: 5173 (Dev)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pages:                                                   │  │
│  │  • Login / Register                                       │  │
│  │  • Customer Dashboard                                     │  │
│  │  • Contractor Dashboard                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Components:                                              │  │
│  │  • Navbar, CreateOrderModal, ProtectedRoute              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services:                                                │  │
│  │  • API Client (Axios)                                     │  │
│  │  • Auth Context (JWT Token Management)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ REST API
                         │ /api/*
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                       │
│                     Port: 5000                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes:                                                  │  │
│  │  • /api/auth (register, login, profile)                  │  │
│  │  • /api/orders (create, list, accept, update)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware:                                              │  │
│  │  • JWT Authentication                                     │  │
│  │  • Role Authorization (customer/contractor)              │  │
│  │  • Input Validation                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers:                                             │  │
│  │  • authController (Login/Register Logic)                 │  │
│  │  • orderController (Order Management Logic)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Models:                                                  │  │
│  │  • User Model (CRUD Operations)                          │  │
│  │  • Order Model (CRUD Operations)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬───────────────────────────┬────────────────────────┘
             │                           │
             │                           │
             │                           │
┌────────────▼────────────┐  ┌──────────▼──────────────────────┐
│   DATABASE               │  │   EMAIL SERVICE                 │
│   (PostgreSQL)           │  │   (Nodemailer)                  │
│   Port: 5432             │  │                                 │
│                          │  │   SMTP Configuration:           │
│  Tables:                 │  │   • Gmail / Mailgun / etc.      │
│  • users                 │  │                                 │
│  • transport_orders      │  │   Templates:                    │
│                          │  │   • Order Created               │
│  Indexes:                │  │   • Order Accepted (Customer)   │
│  • customer_id           │  │   • Order Accepted (Contractor) │
│  • contractor_id         │  │                                 │
│  • status                │  │                                 │
│  • email                 │  │                                 │
└──────────────────────────┘  └─────────────────────────────────┘
```

## 🔄 Datenfluss

### 1. Benutzer-Registrierung

```
Browser → POST /api/auth/register
         ↓
    Validation (express-validator)
         ↓
    Password Hashing (bcrypt)
         ↓
    User.create() → PostgreSQL
         ↓
    Generate JWT Token
         ↓
    Response mit Token & User Data
         ↓
    Browser speichert Token (localStorage)
```

### 2. Auftragserstellung (Kunde)

```
Customer Dashboard → "Neuen Auftrag erstellen"
         ↓
    CreateOrderModal (Formular)
         ↓
    POST /api/orders (mit JWT Token)
         ↓
    JWT Verification
         ↓
    Role Check (nur customer)
         ↓
    Input Validation
         ↓
    Order.create() → PostgreSQL
         ↓
    Email Service → Nodemailer
         ↓
    SMTP → Email an Kunde
         ↓
    Response mit Order Data
         ↓
    Dashboard aktualisiert
```

### 3. Auftragsannahme (Auftragnehmer)

```
Contractor Dashboard → "Verfügbare Aufträge"
         ↓
    GET /api/orders/available (mit JWT Token)
         ↓
    JWT Verification
         ↓
    Role Check (nur contractor)
         ↓
    Order.getAvailableOrders() → PostgreSQL
         ↓
    Liste der pending Orders
         ↓
    Contractor wählt Auftrag → "Annehmen"
         ↓
    PUT /api/orders/:id/accept (mit JWT Token)
         ↓
    JWT Verification
         ↓
    Role Check (nur contractor)
         ↓
    Order.acceptOrder() → PostgreSQL
         ├─ Status: pending → accepted
         ├─ contractor_id gesetzt
         └─ accepted_at timestamp
         ↓
    Email Service → Nodemailer
         ├─ Email an Kunde (Benachrichtigung)
         └─ Email an Contractor (Bestätigung)
         ↓
    Response mit Order Data
         ↓
    Dashboard aktualisiert
```

## 🔐 Authentifizierungs-Flow

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌──────────────────────┐
│   Auth Controller    │
│                      │
│ 2. Find User by Email│
│ 3. Verify Password   │
│    (bcrypt.compare)  │
│ 4. Generate JWT      │
│    (jwt.sign)        │
└──────┬───────────────┘
       │
       │ 5. Response
       │    { token, user }
       ▼
┌──────────────┐
│   Browser    │
│              │
│ 6. Store in  │
│  localStorage│
└──────┬───────┘
       │
       │ 7. Subsequent Requests
       │    Authorization: Bearer <token>
       ▼
┌──────────────────────┐
│  Auth Middleware     │
│                      │
│ 8. Extract Token     │
│ 9. Verify Token      │
│    (jwt.verify)      │
│ 10. Attach user to   │
│     req.user         │
└──────┬───────────────┘
       │
       │ 11. Continue to Route Handler
       ▼
┌──────────────────────┐
│   Controller         │
│   (Protected Route)  │
└──────────────────────┘
```

## 📊 Datenbank-Beziehungen

```
┌─────────────────────────────────────────┐
│              users                      │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ email (UNIQUE)                          │
│ password (hashed)                       │
│ role (customer | contractor)            │
│ company_name                            │
│ first_name                              │
│ last_name                               │
│ phone                                   │
│ created_at                              │
│ updated_at                              │
└───────┬─────────────────┬───────────────┘
        │                 │
        │ 1:N             │ 1:N
        │ (customer)      │ (contractor)
        │                 │
┌───────▼─────────────────▼───────────────┐
│        transport_orders                 │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ customer_id (FK → users.id)             │
│ contractor_id (FK → users.id, nullable) │
│                                         │
│ -- Pickup Info --                       │
│ pickup_address                          │
│ pickup_city                             │
│ pickup_postal_code                      │
│ pickup_date                             │
│ pickup_time                             │
│ pickup_contact_name                     │
│ pickup_contact_phone                    │
│                                         │
│ -- Delivery Info --                     │
│ delivery_address                        │
│ delivery_city                           │
│ delivery_postal_code                    │
│ delivery_date                           │
│ delivery_time                           │
│ delivery_contact_name                   │
│ delivery_contact_phone                  │
│                                         │
│ -- Shipment Details --                  │
│ vehicle_type                            │
│ weight                                  │
│ length, width, height                   │
│ pallets                                 │
│ description                             │
│ special_requirements                    │
│ price                                   │
│                                         │
│ -- Status & Timestamps --               │
│ status (pending|accepted|in_transit|    │
│         completed|cancelled)            │
│ created_at                              │
│ updated_at                              │
│ accepted_at                             │
│ completed_at                            │
└─────────────────────────────────────────┘
```

## 🎯 API Endpoint-Struktur

```
/api
├── /auth
│   ├── POST   /register        # Benutzer registrieren
│   ├── POST   /login           # Benutzer anmelden
│   └── GET    /profile         # Profil abrufen (🔒)
│
└── /orders
    ├── GET    /                # Eigene Aufträge (🔒)
    ├── POST   /                # Auftrag erstellen (🔒 customer)
    ├── GET    /available       # Verfügbare Aufträge (🔒 contractor)
    ├── GET    /:id             # Einzelner Auftrag (🔒)
    ├── PUT    /:id/accept      # Auftrag annehmen (🔒 contractor)
    └── PUT    /:id/status      # Status ändern (🔒)

🔒 = JWT Token erforderlich
🔒 customer = Nur für Kunden
🔒 contractor = Nur für Auftragnehmer
```

## 🔄 Status-Übergänge

```
┌──────────┐
│ pending  │ ← Auftrag erstellt
└────┬─────┘
     │
     │ Contractor nimmt an
     ▼
┌──────────┐
│ accepted │ ← Auftrag angenommen
└────┬─────┘
     │
     │ Transport beginnt
     ▼
┌───────────┐
│in_transit │ ← Unterwegs
└────┬──────┘
     │
     │ Zustellung erfolgt
     ▼
┌───────────┐
│ completed │ ← Abgeschlossen
└───────────┘

     oder
     
┌──────────┐
│ pending  │
└────┬─────┘
     │
     │ Stornierung
     ▼
┌───────────┐
│ cancelled │
└───────────┘
```

## 📧 Email-Flow

```
Event: Auftrag erstellt
         ↓
┌────────────────────┐
│  orderController   │
│  .createOrder()    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Email Service     │
│  emailTemplates    │
│  .orderCreated()   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   Nodemailer       │
│   SMTP Transport   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   Gmail / SMTP     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Kunde Inbox       │
│  ✉️ Bestätigung    │
└────────────────────┘


Event: Auftrag angenommen
         ↓
┌────────────────────┐
│  orderController   │
│  .acceptOrder()    │
└────────┬───────────┘
         │
         ├─────────────────┬──────────────────┐
         ▼                 ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Email an Kunde │  │Email an Contr. │  │ DB Update      │
│ (Benachricht.) │  │ (Bestätigung)  │  │ Status=accepted│
└────────────────┘  └────────────────┘  └────────────────┘
```

## 🛡️ Sicherheits-Layer

```
Request
   │
   ├─ CORS Middleware
   │   └─ Erlaubt nur CLIENT_URL
   │
   ├─ Body Parser
   │   └─ JSON Parsing
   │
   ├─ JWT Verification
   │   ├─ Token vorhanden?
   │   ├─ Token gültig?
   │   └─ Token nicht abgelaufen?
   │
   ├─ Role Authorization
   │   └─ Hat Benutzer die richtige Rolle?
   │
   ├─ Input Validation
   │   ├─ express-validator
   │   └─ Sanitization
   │
   └─ Controller
       └─ Business Logic
```

## 🚀 Deployment-Architektur (Produktion)

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                    (Nginx / Cloudflare)                  │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌───────▼──────┐
│   Frontend   │  │   Backend    │
│   (Vercel/   │  │   (Heroku/   │
│   Netlify)   │  │   Railway)   │
│              │  │              │
│   Static     │  │   Node.js    │
│   Files      │  │   Express    │
└──────────────┘  └───────┬──────┘
                          │
                 ┌────────┴────────┐
                 │                 │
        ┌────────▼──────┐  ┌───────▼──────┐
        │  PostgreSQL   │  │  Email SMTP  │
        │  (Managed DB) │  │  (Mailgun/   │
        │               │  │   SendGrid)  │
        └───────────────┘  └──────────────┘
```

## 📱 Client-Side Routing

```
/
├── /login              → Login Page
├── /register           → Register Page
└── /dashboard          → Protected Route
    ├── Customer Role   → CustomerDashboard
    └── Contractor Role → ContractorDashboard
```

## 🎨 Component-Hierarchie

```
App
├── AuthProvider (Context)
│   └── Router
│       ├── Login
│       ├── Register
│       └── ProtectedRoute
│           └── DashboardRouter
│               ├── CustomerDashboard
│               │   ├── Navbar
│               │   ├── Stats Cards
│               │   ├── Orders Table
│               │   └── CreateOrderModal
│               │
│               └── ContractorDashboard
│                   ├── Navbar
│                   ├── Tabs (Available / My Orders)
│                   └── Order Cards
```

---

Diese Architektur bietet:
- ✅ Skalierbarkeit
- ✅ Sicherheit
- ✅ Wartbarkeit
- ✅ Erweiterbarkeit
- ✅ Klare Trennung von Verantwortlichkeiten
