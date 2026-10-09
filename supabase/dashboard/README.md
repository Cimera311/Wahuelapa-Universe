# game-command direkt im Supabase-Dashboard installieren

Diese Datei ist TypeScript/JavaScript für eine Edge Function, keine SQL-Datei.

1. Projekt qavlbxbkhahjbpgcmazd öffnen und links **Edge Functions** auswählen.
2. **Deploy a new function → Via Editor** wählen. Name exakt **game-command**.
3. Den gesamten Inhalt von `game-command.ts` in die Editor-Datei `index.ts` kopieren und den Beispielcode vollständig ersetzen.
4. **Deploy function** anklicken.
5. In den Details der Funktion **Verify JWT with legacy secret** ausschalten. Die Funktion prüft jede Benutzeranmeldung selbst mit `auth.getUser`; ohne gültiges Benutzertoken liefert sie 401. Dies entspricht `verify_jwt = false` im vorhandenen `supabase/config.toml`.

Keine geheimen Schlüssel in den Code einfügen. Die Funktion liest die serverseitigen Standardvariablen `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`.

Die PvP-SQL ist separat in `../pvp.sql` gespeichert. Wurde sie bereits ausgeführt, ist für diesen Schritt keine weitere SQL nötig. Die Website kann nach erfolgreichem Function-Deploy veröffentlicht werden; PvP bleibt bis zur Aktivierung ausgeschaltet.

Das Bundle wird aus den bestehenden Modulen erzeugt; Änderungen am Spielcode immer in den ursprünglichen Dateien vornehmen und danach neu bündeln:

```powershell
npx --yes deno@2.9.6 bundle --platform deno --external 'npm:@supabase/supabase-js@2.117.2' --no-lock --node-modules-dir=auto --output supabase/dashboard/game-command.ts supabase/functions/game-command/index.ts
```

Die generierte JavaScript-Datei wird für den Dashboard-Editor als `.ts` gespeichert. Nach dem Bündeln die erste Zeile `// @ts-nocheck` voranstellen, da das Bundle die JavaScript-Module enthält; der originale TypeScript-Einstieg wird separat mit `deno check` geprüft.

Offizielle Anleitung: https://supabase.com/docs/guides/functions/quickstart-dashboard
