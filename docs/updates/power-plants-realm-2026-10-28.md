# Realm-Kraftwerke – PR #131

## Inhalt
- Gemeinsame `powerPlants`-Matrix im Client und in `supabase/dashboard/game-command.ts`.
- Pro Planet und Kraftwerk: `enabled`, `exponent`, `efficiency`.
- Solar auf Heimat/Gestein/Eis/Ozean: 100 %/150 %/110 %/50 %.
- Gezeiten auf Eis 25 % und Ozean 125 %; auf Heimat und Gestein gesperrt.
- Treibstoffkraftwerk (`fuelPower`) als Gebäude und Energieberechnung vorbereitet, überall **gesperrt**. Die derzeitigen Baukosten, Bauzeit und Basisleistung sind Platzhalter und nicht zur Freigabe bestimmt.
- Technik-Voraussetzung Gezeiten bleibt Energietechnik 3.
- Ein gesperrtes Kraftwerk darf nicht gebaut werden; ältere vorhandene Stufen verlieren nicht automatisch ihre Produktion.
- Die Save-Validierung ergänzt `fuelPower: 0` beim Einlesen älterer Spielstände.

## SQL – Bestands-Spielstände
Vor dem Deployment der neuen Game-Command die idempotente Migration `supabase/updates/2026-10-28-fuel-power-save-backfill.sql` im Supabase SQL Editor ausführen.
Sie ergänzt `fuelPower: 0` für jeden Planeten, bei dem dieser Gebäudewert fehlt. Bestehende Werte bleiben erhalten. Die Reihenfolge der Planeten und andere Spielstandsfelder werden nicht geändert.

**Vorbereitung:** Backup von `public.game_saves` erstellen und für die kurze Migration laufende Spielaktionen vermeiden. Für geänderte Spielstände erhöht das Skript die `revision` und setzt `updated_at`, damit alte Clients keine unbemerkten Änderungen überschreiben. Anschließend die SELECT-Prüfung ausführen (Erwartung: 0 fehlende Werte).

Die serverseitige Normalisierung beim Laden bleibt zusätzliche Abwärtskompatibilität und ist kein Ersatz für die Migration.

## Ausrollen
1. PR mergen, nachdem die Checks grün sind, und vorher ein Datenbankbackup anlegen.
2. SQL-Backfill in der Wartungsphase ausführen und Prüfung kontrollieren.
3. `supabase/dashboard/game-command.ts` als **vollständige** neue Game-Command in der entsprechenden Supabase Edge Function deployen (nicht bloß den Browser-Client aktualisieren). Die Datei ist das bereitgestellte Deployment-Bundle.
4. Prüfen, dass auf Test und Live jeweils derselbe Stand der Realm-Kraftwerksmatrix verwendet wird.
5. Erst danach die neue Clientversion produktiv nutzen.

## Smoke Tests
- Bestehenden Spielstand ohne `fuelPower` laden: ohne Validierungsfehler; intern Stufe 0.
- Eisplanet, Energietechnik 3: Gezeiten baubar, Produktion 25 % der normalen Basisformel.
- Ozeanplanet: Gezeiten baubar, Produktion 125 %.
- Heimatwelt und Gesteinsplanet: Gezeiten-Bau serverseitig abgelehnt.
- Alle vier Planetentypen: Treibstoffkraftwerk-Bau serverseitig abgelehnt.
- Solar-Ertrag je Planetentyp prüfen; Energietechnik-Bonus bleibt aktiv.
- Bereits laufende Bauaufträge sowie andere Gebäude und Flotten unverändert.
- Serverantwort und UI-Energieanzeige auf denselben Wert prüfen.

Hinweis: SQL-Migration und Edge-Function-Deployment sind getrennte Schritte. Nicht direkt auf Live ausführen, bevor Tests auf dem Testsystem erfolgt sind.
