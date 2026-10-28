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

## SQL
**Für dieses Update ist keine SQL-Migration erforderlich.** `public.game_saves.state` wird bereits als JSONB gespeichert (`supabase/setup.sql`); die Gebäude stecken im Spielstandsobjekt, nicht in separaten Datenbankspalten. Ein neues DB-Feld oder Constraint wird nicht benötigt.

**Keine SQL-Datei ausführen.** Es ist insbesondere keine Massenänderung vorhandener JSONB-Spielstände erforderlich.

## Ausrollen
1. PR mergen, nachdem die Checks grün sind.
2. `supabase/dashboard/game-command.ts` als **vollständige** neue Game-Command in der entsprechenden Supabase Edge Function deployen (nicht bloß den Browser-Client aktualisieren). Die Datei ist das bereitgestellte Deployment-Bundle.
3. Prüfen, dass auf Test und Live jeweils derselbe Stand der Realm-Kraftwerksmatrix verwendet wird.
4. Erst danach die neue Clientversion produktiv nutzen.

## Smoke Tests
- Bestehenden Spielstand ohne `fuelPower` laden: ohne Validierungsfehler; intern Stufe 0.
- Eisplanet, Energietechnik 3: Gezeiten baubar, Produktion 25 % der normalen Basisformel.
- Ozeanplanet: Gezeiten baubar, Produktion 125 %.
- Heimatwelt und Gesteinsplanet: Gezeiten-Bau serverseitig abgelehnt.
- Alle vier Planetentypen: Treibstoffkraftwerk-Bau serverseitig abgelehnt.
- Solar-Ertrag je Planetentyp prüfen; Energietechnik-Bonus bleibt aktiv.
- Bereits laufende Bauaufträge sowie andere Gebäude und Flotten unverändert.
- Serverantwort und UI-Energieanzeige auf denselben Wert prüfen.

Hinweis: Die SQL-Migration entfällt; jedoch sind Deployment und Test gegen die echte Game-Command weiterhin erforderlich.
