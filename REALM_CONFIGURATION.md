# Realm-Konfiguration: Flugzeiten

Die zentrale, direkt auf GitHub editierbare Konfiguration liegt in **[`src/realm-config.js`](https://github.com/Cimera311/Wahuelapa-Universe/blob/main/src/realm-config.js)**.

```js
export const REALM_CONFIG = Object.freeze({
  galaxyFlightTimeFactor: 3,
});
```

**3** bedeutet: Galaxieflüge dauern dreimal so lange wie bislang. **2** verdoppelt, **1** entspricht dem bisherigen Wert. Positive Zwischenwerte wie **1.5** sind möglich.

Diese Einstellung gilt für **alle neuen Flugabschnitte mit mindestens einer Galaxiekolonie**, auch innerhalb eines gemeinsamen Sonnensystems: Angriffe, Stationierungen, Transporte, Partnerflüge, Handelsrouten, Fernsonden und Galaxie-Kolonieschiffe. Es betrifft die **Zeit**, nicht den Treibstoffverbrauch oder den Forschungsbonus. Private Tutorial-Flüge bleiben bei ihrer bisherigen Zeit.

Der bisherige Mindestflug von 60 Sekunden in der Galaxie wird mit dem Faktor 3 zu **180 Sekunden**. Zuerst greift die Mindestzeit, danach der Realm-Faktor.

## Selbst einstellen

1. In GitHub `src/realm-config.js` öffnen, oben rechts auf den **Stift (Edit this file)** tippen.
2. Die Zahl hinter `galaxyFlightTimeFactor:` ändern und committen (idealerweise per Pull Request).
3. Den Web-Build ausführen (`npm run build`) und die neue Website veröffentlichen.
4. **Wichtig:** Die bestehende Supabase-Funktion **`swift-handler`** muss mit demselben Quellstand neu gebündelt und deployed werden; siehe [Dashboard-Anleitung](supabase/dashboard/README.md). **Nicht** nur den Quellwert ändern, während auf dem Server noch das alte Bundle läuft.
5. Die neue Einstellung wirkt ausschließlich auf **künftig startende Flugabschnitte**. Gespeicherte Ankunftszeiten und Rückflüge bereits laufender Missionen bleiben bestehen.

Die Version **2026-10-12.02** ist das erste Dashboard-Bundle mit Faktor 3. Für **jede weitere Änderung** müssen die Game-Command-Dateien und das Versionsarchiv wieder aktualisiert werden.

Diese erste Konfiguration ist ein **Buildzeit-Parameter für das aktuelle Hauptrealm**, noch kein Live-Regler und noch keine realm-spezifische Server-Konfigurationsdatenbank. Eine spätere Offline-LAN- oder Multi-Realm-Serverinstallation kann eigene Profile derselben Struktur laden.

## Inventar für die nächste Ausbaustufe (25.10.2026)

Der auskommentierte Katalog am Ende von `src/realm-config.js` erfasst weitere
Realm-Kandidaten einschließlich ihrer derzeitigen Werte. Die Originalstellen
tragen `REALM-CANDIDATE[id]`. Diese Einträge sind **noch nicht angeschlossen**;
Auskommentieren allein aktiviert keine Einstellung. Speicherprüfung, SQL,
Frontend und serverseitige Engine müssen gemeinsam angepasst werden.

Das [Mehrspieler- und Serverkonzept](docs/multiplayer-plan-2026-10-25.md)
beschreibt Reihenfolge, Live-Befunde, Migrationsrisiken und Abnahmekriterien.
