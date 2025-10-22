# 📄 CMR-System - Schnellstart

## Was ist das CMR-System?

Das CMR-System erstellt automatisch internationale Frachtbriefe (Convention relative au contrat de transport international de Marchandises par Route) bei jedem Transportauftrag und ermöglicht digitale Unterschriften auf mobilen Geräten.

## 🚀 Schnellstart

### 1. CMR-Schema installieren

```bash
# CMR-Tabellen zur Datenbank hinzufügen
psql zipmend_db < server/database/cmr_schema.sql
```

### 2. Dependencies installieren

```bash
# Neue Pakete installieren (pdfkit, qrcode)
npm install
```

### 3. Fertig!

Das CMR-System ist jetzt aktiv und funktioniert automatisch.

## 📱 Wie funktioniert es?

### Für Kunden (Auftraggeber):

1. **Auftrag erstellen** - wie gewohnt
2. **Auftrag wird angenommen** - CMR wird automatisch erstellt
3. **CMR anzeigen** - Klicken Sie auf "CMR anzeigen" in der Auftragstabelle
4. **Bei Zustellung** - Sie erhalten eine Email mit Bestätigung

### Für Auftragnehmer:

1. **Auftrag annehmen** - CMR wird automatisch erstellt
2. **CMR öffnen** - Klicken Sie auf "CMR anzeigen" bei Ihren Aufträgen
3. **Link kopieren** - Kopieren Sie den Unterschrifts-Link
4. **An Empfänger senden** - Per WhatsApp, SMS oder Email
5. **Warten auf Unterschrift** - Empfänger unterschreibt auf seinem Handy
6. **Fertig!** - Sie erhalten eine Email-Bestätigung

### Für Empfänger:

1. **Link öffnen** - Auf dem Smartphone
2. **Details prüfen** - Sendungsdetails werden angezeigt
3. **Unterschreiben** - Mit dem Finger auf dem Bildschirm
4. **Bestätigen** - Fertig!

## 🎯 Beispiel-Workflow

```
Kunde erstellt Auftrag
    ↓
Auftragnehmer nimmt an
    ↓
✨ CMR wird automatisch erstellt ✨
    ↓
Auftragnehmer transportiert
    ↓
Bei Zustellung: Link an Empfänger senden
    ↓
Empfänger unterschreibt auf Handy
    ↓
✅ Alle erhalten Email-Bestätigung
    ↓
PDF mit Unterschrift verfügbar
```

## 📧 Email-Benachrichtigungen

### Wann werden Emails gesendet?

1. **Auftragserstellung** → Email an Kunde
2. **Auftragsannahme** → Email an Kunde & Auftragnehmer (mit CMR-Info)
3. **Empfänger unterschreibt** → Email an Kunde & Auftragnehmer

## 🔗 Unterschrifts-Link

Der Link sieht so aus:
```
https://ihre-domain.de/cmr/CMR25000001
```

**Wichtig**: 
- Link funktioniert ohne Login
- Kann auf jedem Gerät geöffnet werden
- Ist sicher durch eindeutige CMR-Nummer

## 📄 Was enthält das CMR?

- ✅ Absender-Informationen
- ✅ Empfänger-Informationen
- ✅ Frachtführer-Informationen
- ✅ Sendungsdetails (Gewicht, Paletten, etc.)
- ✅ Abholadresse und -datum
- ✅ Zustelladresse
- ✅ Besondere Anforderungen
- ✅ Drei Unterschriftsfelder
- ✅ QR-Code für schnellen Zugriff
- ✅ Eindeutige CMR-Nummer

## 💡 Tipps

### Für Auftragnehmer:
- Kopieren Sie den Link direkt nach Abholung
- Senden Sie ihn per WhatsApp - am einfachsten!
- Empfänger braucht keine App oder Registrierung

### Für Empfänger:
- Prüfen Sie die Sendung vor dem Unterschreiben
- Fügen Sie Bemerkungen hinzu bei Schäden
- Unterschrift kann nicht rückgängig gemacht werden

## 🐛 Probleme?

### CMR wird nicht angezeigt
- Warten Sie 2-3 Sekunden nach Auftragsannahme
- Aktualisieren Sie die Seite
- Prüfen Sie, ob der Auftrag wirklich angenommen wurde

### Link funktioniert nicht
- Prüfen Sie die CMR-Nummer
- Stellen Sie sicher, dass der Link vollständig ist
- Versuchen Sie es in einem anderen Browser

### Unterschrift wird nicht gespeichert
- Stellen Sie sicher, dass Sie wirklich unterschrieben haben
- Klicken Sie auf "Bestätigen"
- Prüfen Sie Ihre Internetverbindung

## 📚 Weitere Dokumentation

- **Vollständige CMR-Dokumentation**: `CMR_DOCUMENTATION.md`
- **Setup-Anleitung**: `SETUP.md`
- **API-Dokumentation**: `ARCHITECTURE.md`

## ✅ Checkliste

- [ ] CMR-Schema in Datenbank importiert
- [ ] Dependencies installiert (`npm install`)
- [ ] Server neu gestartet
- [ ] Testauftrag erstellt und angenommen
- [ ] CMR-Dokument wird angezeigt
- [ ] Unterschrifts-Link funktioniert
- [ ] Email-Benachrichtigungen kommen an

---

**Viel Erfolg mit dem CMR-System!** 📄✍️
