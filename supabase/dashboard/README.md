# game-command direkt im Supabase-Dashboard installieren

Diese Datei ist TypeScript/JavaScript für eine Edge Function, keine SQL-Datei.

1. Projekt qavlbxbkhahjbpgcmazd öffnen und links **Edge Functions** auswählen.
2. Die vorhandene Funktion **swift-handler** öffnen (siehe `src/cloud-config.js`, `commandFunction`). Im Code-Editor die bestehende Funktion aktualisieren; keine zweite Funktion anlegen.
3. Den gesamten Inhalt von `game-command.ts` (am Handy `game-command-gesamt.txt`) in die Editor-Datei `index.ts` kopieren und den Beispielcode vollständig ersetzen.
4. **Deploy function** anklicken.
5. In den Details der Funktion **Verify JWT with legacy secret** ausschalten. Die Funktion prüft jede Benutzeranmeldung selbst mit `auth.getUser`; ohne gültiges Benutzertoken liefert sie 401. Dies entspricht `verify_jwt = false` im vorhandenen `supabase/config.toml`.

Keine geheimen Schlüssel in den Code einfügen. Die Funktion liest die serverseitigen Standardvariablen `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`.

Die PvP-SQL ist separat in `../pvp.sql` gespeichert. Für das gemeinsame Update zusätzlich `../partnerships.sql` installieren; die genaue Reihenfolge steht unten. Die Website kann nach erfolgreichem Function-Deploy veröffentlicht werden; PvP bleibt bis zur Aktivierung ausgeschaltet.

Das Bundle wird aus den bestehenden Modulen erzeugt; Änderungen am Spielcode immer in den ursprünglichen Dateien vornehmen und danach neu bündeln:

```powershell
npx --yes deno@2.9.6 bundle --platform deno --external 'npm:@supabase/supabase-js@2.117.2' --no-lock --node-modules-dir=auto --output supabase/dashboard/game-command.ts supabase/functions/game-command/index.ts
```

Alternativ (ohne Deno-Bundler):

```sh
npx --yes esbuild@0.25.12 supabase/functions/game-command/index.ts --bundle --format=esm --platform=neutral --target=es2022 --external:npm:@supabase/supabase-js@2.117.2 --banner:js='// @ts-nocheck — Generated dashboard bundle; edit source modules instead.' --outfile=supabase/dashboard/game-command.ts
```

## Werft und Energie

Dieses gemeinsame Bundle ist mit `main` Commit `f78648abdc7a45dc661f10e632d17f5c61b8d2e4` (gemergter PR #9) abgeglichen und enthält die Flugzeiten aus #9, Werft/Energie aus #10 sowie Partnerschaften, direkte Tauschgeschäfte und Unterstützungsschiffe aus dem anschließenden PR. Die Datei `game-command-werft.txt` ist nur noch ein identischer Kompatibilitätsname; für das Gesamtupdate `game-command-gesamt.txt` verwenden.

- Neue Schiffs- und Verteidigungsaufträge: normale Bauzeit × `0.92^(Werftstufe - 1)` ab Stufe 1, auf volle Millisekunden aufgerundet.
- Dauerverbrauch der Werft: `ceil(10 × Stufe^1.5)`; Stufe 0 verbraucht 0. Der planetare Faktor gilt für alle vorhandenen Verbraucher (Minen und Werft), auch bei leerer Werft.
- Energieversorgung bremst Minen und laufenden Schiffbau im Verhältnis Erzeugung / Bedarf, höchstens 100 %. Bei null Strom pausiert der Schiffbau.
- Gespeicherte Arbeitsmenge bleibt erhalten. Kraftwerks-, Minen-, Werftausbauten und Energieforschung verändern die Versorgung exakt ab Fertigstellung, auch offline. Der Werftbonus selbst wird beim Start eines Auftrags festgelegt.
- Alte Aufträge behalten ihre bisherige normale Arbeitsmenge und den schon erreichten Fortschritt; kein rückwirkender Werftbonus. Ab ihrem gespeicherten Zeitpunkt gilt die neue Energieversorgung.
- Abbrechen erstattet weiterhin den tatsächlichen bezahlten Betrag; Material für Verteidigungsreparaturen bleibt separat.

**Reihenfolge:** zuerst dieses Bundle in der vorhandenen Funktion `swift-handler` deployen, danach den Website-PR mergen. Für Partnerschaften ist die zusätzliche SQL-Migration `supabase/partnerships.sql` nötig (siehe folgende Reihenfolge). Bestehende starke Werften können dadurch eine Energieunterversorgung bekommen. Die Website zeigt den lokalen Dauerbedarf, Bedarf der nächsten Gebäudestufe, Werftleistung und geschätzte Restzeit.

Die generierte JavaScript-Datei wird für den Dashboard-Editor als `.ts` gespeichert. Nach dem Bündeln die erste Zeile `// @ts-nocheck` voranstellen, da das Bundle die JavaScript-Module enthält; der originale TypeScript-Einstieg wird separat mit `deno check` geprüft.

Offizielle Anleitung: https://supabase.com/docs/guides/functions/quickstart-dashboard

## Gemeinsames Update: Partnerschaften, Handel und Verteidigung

1. Bestehende Migrationen für PvP, Berichte und Kampfprotokolle müssen installiert sein: `pvp.sql`, `reports.sql`, `combat-logs.sql`, `combat-log-pagination.sql`. Vorhandene Migrationen nicht unnötig erneut ausführen.
2. **Einmal `supabase/partnerships.sql` im SQL-Editor ausführen.** Sie erweitert das atomare Snapshot/Commit-Verfahren, speichert Partnerschaften und Partnerflotten, zählt gebundene Schiffe für ihren Besitzer und gibt beteiligten Unterstützern Zugriff auf ihre Kampfberichte. Sie kann wiederholt werden und setzt keine Partnerschaften zurück. Immer nach den anderen genannten Migrationen installieren; diese danach nicht erneut überschreiben.
3. Inhalt von **`game-command-gesamt.txt`** in der vorhandenen Funktion **`swift-handler`** ersetzen und deployen. Funktionsname und Auth-Einstellungen beibehalten.
4. Den **gemeinsamen Partnerschaften-PR** mergen. PR #9 ist bereits gemergt. Der gemeinsame PR enthält auch #10; #10 nicht zusätzlich mergen und anschließend als ersetzt schließen.

Das öffentliche Handels-/Auktionshaus bleibt TODO. Implementiert sind direkte Tauschgeschäfte zwischen bestätigten Partnern. Offene Tauschangebote gelten eine Stunde und blockieren vorher noch keine Waren oder Frachter; Verfügbarkeit wird bei Annahme erneut geprüft. Erst die Annahme bindet beide Ladungen und startet die Lieferflotte atomar. Beim Rückflug erhält der Verkäufer seine Gegenleistung. Auch ein späterer Entzug des Lieferrechts bricht einen bezahlten Tausch nicht ab.

Liefer- und Verteidigungsrechte sind getrennt und werden von jedem Gastgeber ausdrücklich erteilt. Nur gemeinsame, besiedelte Galaxiekolonien dienen als Start und Ziel. Lieferungen und Unterstützung verwenden normale gemeinsame Flugzeiten mit vorab bezahltem Hin-/Rückflug. Bei Widerruf werden noch nicht ausgelieferte Geschenke und Unterstützungsflotten zurückgeschickt; im Hinflug dauert die Umkehr die bereits verstrichene Reisezeit, stationierte Flotten benötigen die volle Rückflugzeit.

Unterstützer bleiben Eigentümer ihrer Flotten. Der Gastgeber kann sie nicht für Angriffe verwenden; er kann sie zurückschicken. Im Kampf gelten Forschung, Hüllenschäden und Schildregeneration jeder Flottengruppe separat. Eigene Verluste, Unterstützung und Schussprotokolle werden dauerhaft für die beteiligten Commander gespeichert. Kein automatisches Verbot gegenseitiger Angriffe durch eine Partnerschaft; nur die ausdrücklich gewählten Rechte werden vergeben.

Obergrenzen: 20 eigene aktive Partnerflotten, 20 eigene Partnerschaften/Einladungen, 10 eigene offene Tauschangebote. Die Obergrenzen beziehen sich auf Aufträge, nicht auf Schiffsmengen.
