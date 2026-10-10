# game-command direkt im Supabase-Dashboard installieren

Diese Datei ist TypeScript/JavaScript für eine Edge Function, keine SQL-Datei.

1. Projekt qavlbxbkhahjbpgcmazd öffnen und links **Edge Functions** auswählen.
2. Die vorhandene Funktion **swift-handler** öffnen (siehe `src/cloud-config.js`, `commandFunction`). Im Code-Editor die bestehende Funktion aktualisieren; keine zweite Funktion anlegen.
3. Den gesamten Inhalt von `game-command.ts` (am Handy alternativ `game-command-werft.txt`) in die Editor-Datei `index.ts` kopieren und den Beispielcode vollständig ersetzen.
4. **Deploy function** anklicken.
5. In den Details der Funktion **Verify JWT with legacy secret** ausschalten. Die Funktion prüft jede Benutzeranmeldung selbst mit `auth.getUser`; ohne gültiges Benutzertoken liefert sie 401. Dies entspricht `verify_jwt = false` im vorhandenen `supabase/config.toml`.

Keine geheimen Schlüssel in den Code einfügen. Die Funktion liest die serverseitigen Standardvariablen `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`.

Die PvP-SQL ist separat in `../pvp.sql` gespeichert. Wurde sie bereits ausgeführt, ist für diesen Schritt keine weitere SQL nötig. Die Website kann nach erfolgreichem Function-Deploy veröffentlicht werden; PvP bleibt bis zur Aktivierung ausgeschaltet.

Das Bundle wird aus den bestehenden Modulen erzeugt; Änderungen am Spielcode immer in den ursprünglichen Dateien vornehmen und danach neu bündeln:

```powershell
npx --yes deno@2.9.6 bundle --platform deno --external 'npm:@supabase/supabase-js@2.117.2' --no-lock --node-modules-dir=auto --output supabase/dashboard/game-command.ts supabase/functions/game-command/index.ts
```

Alternativ (ohne Deno-Bundler):

```sh
npx --yes esbuild@0.25.12 supabase/functions/game-command/index.ts --bundle --format=esm --platform=neutral --target=es2022 --external:npm:@supabase/supabase-js@2.117.2 --banner:js='// @ts-nocheck — Generated dashboard bundle; edit source modules instead.' --outfile=supabase/dashboard/game-command.ts
```

## Werft und Energie

Dieses Bundle basiert auf `main` Commit `b836881c25d60d930b14d6dc062c33328eaff0d2` plus den Werftänderungen. Der separate Flugzeiten-PR #9 ist nicht enthalten.

- Neue Schiffs- und Verteidigungsaufträge: normale Bauzeit × `0.92^(Werftstufe - 1)` ab Stufe 1, auf volle Millisekunden aufgerundet.
- Dauerverbrauch der Werft: `ceil(10 × Stufe^1.5)`; Stufe 0 verbraucht 0. Der planetare Faktor gilt für alle vorhandenen Verbraucher (Minen und Werft), auch bei leerer Werft.
- Energieversorgung bremst Minen und laufenden Schiffbau im Verhältnis Erzeugung / Bedarf, höchstens 100 %. Bei null Strom pausiert der Schiffbau.
- Gespeicherte Arbeitsmenge bleibt erhalten. Kraftwerks-, Minen-, Werftausbauten und Energieforschung verändern die Versorgung exakt ab Fertigstellung, auch offline. Der Werftbonus selbst wird beim Start eines Auftrags festgelegt.
- Alte Aufträge behalten ihre bisherige normale Arbeitsmenge und den schon erreichten Fortschritt; kein rückwirkender Werftbonus. Ab ihrem gespeicherten Zeitpunkt gilt die neue Energieversorgung.
- Abbrechen erstattet weiterhin den tatsächlichen bezahlten Betrag; Material für Verteidigungsreparaturen bleibt separat.

**Reihenfolge:** zuerst dieses Bundle in der vorhandenen Funktion `swift-handler` deployen, danach den Website-PR mergen. Keine neue SQL-Migration nötig. Bestehende starke Werften können dadurch eine Energieunterversorgung bekommen. Die Website zeigt den lokalen Dauerbedarf, Bedarf der nächsten Gebäudestufe, Werftleistung und geschätzte Restzeit.

Die generierte JavaScript-Datei wird für den Dashboard-Editor als `.ts` gespeichert. Nach dem Bündeln die erste Zeile `// @ts-nocheck` voranstellen, da das Bundle die JavaScript-Module enthält; der originale TypeScript-Einstieg wird separat mit `deno check` geprüft.

Offizielle Anleitung: https://supabase.com/docs/guides/functions/quickstart-dashboard
