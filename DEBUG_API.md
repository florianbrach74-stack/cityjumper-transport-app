# 🔍 API DEBUG GUIDE

## Problem: "Fehler beim Laden der Daten"

### 1. BACKEND PRÜFEN

```bash
# Backend erreichbar?
curl https://cityjumper-api-production-01e4.up.railway.app/api/auth/login

# Sollte zurückgeben:
# {"error":"Email and password are required"}
```

### 2. FRONTEND PRÜFEN

**Browser-Konsole öffnen (F12):**

```javascript
// Token vorhanden?
localStorage.getItem('token')

// User vorhanden?
localStorage.getItem('user')

// API-URL korrekt?
console.log('API URL:', 'https://cityjumper-api-production-01e4.up.railway.app/api')
```

### 3. NETWORK ERRORS

**Mögliche Ursachen:**

1. **Kein Token:**
   - Lösung: Neu einloggen
   - Token wird bei Login gespeichert

2. **Token abgelaufen:**
   - Lösung: Neu einloggen
   - Token ist 7 Tage gültig

3. **CORS-Problem:**
   - Backend sollte `Access-Control-Allow-Origin: *` setzen
   - Prüfen in Network-Tab

4. **Backend offline:**
   - Railway-Deployment prüfen
   - Logs ansehen

### 4. SCHNELLE LÖSUNG

**Im Browser:**

```javascript
// 1. Ausloggen
localStorage.clear()

// 2. Seite neu laden
window.location.reload()

// 3. Neu einloggen
```

### 5. RAILWAY LOGS PRÜFEN

```bash
# Railway CLI
railway logs

# Oder im Railway Dashboard:
# https://railway.app/project/...
```

### 6. HÄUFIGSTE FEHLER

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| Network Error | Kein Internet / Backend offline | Backend-Status prüfen |
| 401 Unauthorized | Token fehlt/ungültig | Neu einloggen |
| 403 Forbidden | Keine Berechtigung | Rolle prüfen |
| 404 Not Found | Falsche Route | API-Route prüfen |
| 500 Server Error | Backend-Fehler | Logs prüfen |

### 7. DEBUG-MODUS AKTIVIEREN

**In api.js:**

```javascript
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers
  });
  return config;
});
```

### 8. DEPLOYMENT PRÜFEN

**Railway:**
- Status: Running? ✅
- Logs: Errors? ❌
- Environment: Production? ✅

**Vercel:**
- Status: Ready? ✅
- Build: Success? ✅
- Domain: Aktiv? ✅

### 9. NOTFALL-LÖSUNG

**Lokales Backend starten:**

```bash
cd server
npm install
npm run dev

# In client/src/services/api.js ändern:
# const API_URL = 'http://localhost:5000/api';
```

### 10. SUPPORT

**Wenn nichts hilft:**

1. Screenshot von Browser-Konsole (F12)
2. Screenshot von Network-Tab
3. Railway-Logs kopieren
4. Mir schicken!
