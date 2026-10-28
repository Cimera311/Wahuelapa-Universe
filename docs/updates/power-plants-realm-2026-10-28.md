# Realm-Kraftwerke – PR #131

## Inhalt
- Gemeinsame `powerPlants`-Matrix im Client und in `supabase/dashboard/game-command.ts`.
- Pro Planet und Kraftwerk: `enabled`, `exponent`, `efficiency`.
- Solar auf Heimat/Gestein/Eis/Ozean: 100 %/110 %/110 %/90 %.
- Gezeiten auf Eis 35 % und Ozean 125 %; auf Heimat und Gestein gesperrt.
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
- Eisplanet, Energietechnik 3: Gezeiten baubar, Produktion 35 % der normalen Basisformel.
- Ozeanplanet: Gezeiten baubar, Produktion 125 %.
- Heimatwelt und Gesteinsplanet: Gezeiten-Bau serverseitig abgelehnt.
- Alle vier Planetentypen: Treibstoffkraftwerk-Bau serverseitig abgelehnt.
- Solar-Ertrag je Planetentyp prüfen; Energietechnik-Bonus bleibt aktiv.
- Bereits laufende Bauaufträge sowie andere Gebäude und Flotten unverändert.
- Serverantwort und UI-Energieanzeige auf denselben Wert prüfen.

Hinweis: SQL-Migration und Edge-Function-Deployment sind getrennte Schritte. Nicht direkt auf Live ausführen, bevor Tests auf dem Testsystem erfolgt sind.

## Simulation vorhandener Spielstände (28.10.2026)
- Read-only-Abfrage der 14 vorhandenen Saves mit insgesamt 79 Planeten.
- Ergebnis mit Solar 90 % auf Ozean und Gezeiten 35 % auf Eis: **kein einziger Planet verliert aktuell Rohstoffproduktion durch Energieknappheit** (alle 79 bei 100 % Versorgungsquote vorher und nachher).
- Ozeanplaneten insgesamt: 24.240 → 25.851 Energie (+6,6 %); einzelne Planeten können trotz allem weniger Energiereserve haben, ohne aktuell Produktion zu verlieren.
- Gesteinsplaneten insgesamt: 37.711 → 41.477 Energie (+10 %).
- Eisplaneten insgesamt: 39.784 → 43.759 Energie (+10 %); derzeit kein ausgebautes Gezeitenkraftwerk auf Eis.
- **Keine Produktionsgarantie für spätere Ausbaustufen:** Jede weitere Mine, Werft und Energienutzung kann das Verhältnis ändern. Bei der Freigabe muss außerdem die Kompatibilität bereits gebauter Gezeitenkraftwerke auf Heimatwelten erhalten bleiben.

### Zweite Balancekorrektur (28.10.2026)
- Gesteinsplanet Solar-Effizienz von 150 % auf 110 % abgesenkt (Client und Game-Command synchronisiert).
- Read-only-Neuberechnung aller 14 Saves / 79 Planeten: **0 Planeten mit Produktionsverlust**; alle Versorgungsquoten bleiben bei 100 %.
- Gesteinsplaneten erzeugen insgesamt 41.477 statt 37.711 Energie (+10 % gegenüber bisher), anstatt +50 % im vorherigen PR-Stand.
- Heimatwelt, Eis, Ozean und Kontinental unverändert zur ersten Korrektur.
