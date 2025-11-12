# Domain www.courierly.de mit Vercel verbinden

## 🌐 Schritt-für-Schritt Anleitung

### 1. **Bei Ihrem Domain-Provider (z.B. IONOS, Strato, etc.)**

Fügen Sie folgende DNS-Einträge hinzu:

#### A) **CNAME Record für www:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (oder Auto)
```

#### B) **A Record für Root Domain (optional):**
```
Type: A
Name: @ (oder leer für Root)
Value: 76.76.21.21
TTL: 3600
```

**ODER alternativ CNAME für Root:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

---

### 2. **In Vercel Dashboard**

1. **Gehen Sie zu:** https://vercel.com/dashboard
2. **Wählen Sie Ihr Projekt:** `cityjumper-transport-app`
3. **Klicken Sie auf:** "Settings" → "Domains"
4. **Fügen Sie Domain hinzu:**
   - Geben Sie ein: `www.courierly.de`
   - Klicken Sie "Add"
5. **Fügen Sie auch Root Domain hinzu:**
   - Geben Sie ein: `courierly.de`
   - Klicken Sie "Add"
6. **Vercel wird automatisch SSL-Zertifikat erstellen**

---

### 3. **DNS-Einträge bei Ihrem Provider**

#### **Beispiel für IONOS:**

1. Login bei IONOS
2. Domains → Ihre Domain auswählen
3. DNS-Einstellungen
4. Fügen Sie hinzu:

```
CNAME | www | cname.vercel-dns.com
A     | @   | 76.76.21.21
```

#### **Beispiel für Strato:**

1. Login bei Strato
2. Domains → Domain-Verwaltung
3. DNS-Einstellungen bearbeiten
4. Fügen Sie hinzu:

```
www.courierly.de → CNAME → cname.vercel-dns.com
courierly.de → A → 76.76.21.21
```

---

### 4. **Warten auf DNS-Propagierung**

- **Dauer:** 5 Minuten bis 48 Stunden
- **Durchschnittlich:** 1-2 Stunden
- **Prüfen:** https://www.whatsmydns.net/#CNAME/www.courierly.de

---

### 5. **Vercel Konfiguration überprüfen**

Nach DNS-Propagierung sollte in Vercel stehen:

```
✅ www.courierly.de - Valid Configuration
✅ courierly.de - Valid Configuration
```

---

## 🔧 Alternative: Vercel Nameservers verwenden

**Wenn Sie volle Kontrolle über DNS haben möchten:**

1. **In Vercel:**
   - Settings → Domains
   - Klicken Sie "Use Vercel Nameservers"
   - Notieren Sie die Nameserver:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```

2. **Bei Ihrem Domain-Provider:**
   - Ändern Sie die Nameserver zu:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```

3. **Warten Sie 24-48h auf Propagierung**

---

## ✅ Testen

Nach erfolgreicher Konfiguration:

```bash
# Test DNS
nslookup www.courierly.de

# Test HTTPS
curl -I https://www.courierly.de
```

**Oder im Browser:**
- https://www.courierly.de
- https://courierly.de

Beide sollten Ihre Courierly-App zeigen! 🎉

---

## 🆘 Troubleshooting

### Problem: "Domain not found"
- **Lösung:** DNS noch nicht propagiert, warten Sie 1-2 Stunden

### Problem: "Invalid Configuration"
- **Lösung:** CNAME-Eintrag überprüfen, muss exakt `cname.vercel-dns.com` sein

### Problem: "SSL Certificate Error"
- **Lösung:** Warten Sie, Vercel erstellt automatisch Let's Encrypt Zertifikat

---

## 📞 Support

Bei Problemen:
- **Vercel Docs:** https://vercel.com/docs/concepts/projects/domains
- **Vercel Support:** https://vercel.com/support
