# Bugfix: Route-Anzeige & Endlos-Loop (August 2026)

**Status:** Gefixt und deployed  
**Betroffene Seiten:** Courily Landing Page, Auftragserstellung (`CreateOrderModal`), Karten-Widget  
**Haupt-Commit:** `dc4a870`

## Symptome

- Auf der Karte wurde keine Route mehr angezeigt.
- Aufträge konnten nicht erstellt werden, weil die Route/Preisberechnung fehlte.
- Browser-Konsole zeigte `_leaflet_pos`-Fehler.
- Railway-Logs zeigten sehr viele `POST /api/pricing/calculate`-Requests in kurzer Zeit.

## Ursachen

### 1. Frontend: Endlos-Loop in `RouteMap.jsx`

- `RouteMap` erhielt optionale Props `pickupStops = []` und `deliveryStops = []`.
- JavaScript erzeugt bei jedem Render neue leere Array-Referenzen, wenn kein Wert übergeben wird.
- Der `useEffect`, der die Route holt, hatte diese Arrays in den Dependencies.
- Dadurch wurde `fetchRoute` endlos neu ausgelöst.
- `fetchRoute` rief `onRouteCalculated` auf, was in `LandingPage.jsx` wieder `POST /api/pricing/calculate` auslöste.
- Die ständigen Re-Renders haben die Leaflet-Map immer wieder aus- und wieder eingehängt → `_leaflet_pos`-Fehler.

### 2. Backend: Geocoding-Rate-Limits

- Nominatim wurde mit parallelen Requests und ohne aussagekräftigen `User-Agent` aufgerufen.
- Bei Fehlern gab es keinen Fallback.

## Durchgeführte Änderungen

### Frontend

**`client/src/components/RouteMap.jsx`**

- Stabile Default-Arrays eingeführt:
  ```jsx
  const EMPTY_STOPS = [];
  ```
- `pickupStops` und `deliveryStops` verwenden jetzt das stabile `EMPTY_STOPS`.
- Koordinaten werden vor jedem Leaflet-Render geprüft (`hasValidCoords`).
- `MapBounds` ruft `fitBounds` erst über `map.whenReady()` auf und prüft `map._container`.

### Backend

**`server/routes/pricing.js`**

- Photon-Fallback für Nominatim hinzugefügt.
- Besseren `User-Agent` für Geocoding-Requests gesetzt.

**`server/services/distanceService.js`**

- Nominatim-`User-Agent` aktualisiert.
- Parallele Geocoding-Requests in sequenzielle Aufrufe geändert, um Rate-Limits zu respektieren.

## Deployment

1. Code auf `main` gepusht (`dc4a870`).
2. Vercel hat das Frontend automatisch neu gebaut.
3. Railway-Backend musste manuell redeployed werden, da der Auto-Deploy nicht angesprungen ist.

## Verifikation

- Adressen auf der Landing Page eingeben.
- Route sollte sofort in der Karte gezeichnet werden.
- `POST /api/pricing/calculate` darf nur einmal pro Adressänderung erscheinen.
- Auftrag erstellen: Karte anzeigen, Preis berechnen, Auftrag speicherbar.

## Schnelle Checks für den nächsten Fehlerfall

- Prüfen, ob Railway den letzten `main`-Branch deployed hat.
- Im Browser-Tab prüfen, ob `RouteMap` nicht mehrfach re-rendered (`console.log` im `useEffect`).
- `Network`-Tab auf wiederholte `pricing/calculate`- oder `pricing/geocode`-Requests prüfen.
- Bei Nominatim-Problemen erst Photon-Fallback im `pricing.js` prüfen.
