# Serveroptimierung: Aktivierung und Rollback

Status: vorbereitet, NICHT deployed. Live-Projekt: qavlbxbkhahjbpgcmazd (Wahuelapa).
Ausgangs-Website: c56f89c9f87effc5b61cf835fc0f9cd4a2dedcdb.
Am 27.10.2026 gelesene aktive Edge-Version: 45, verify_jwt=false.
Live-Flugfaktor bleibt 3. Keine lokalen CPU-Limit-Patches oder Teststartskripte.

## Umfang und Grenzen

- Optional gesampelte Metriken mit festen Labels; keine Spieler-IDs, Saves oder Tokens.
- Additiver privater Compact-Snapshot mit allen aktiven Angriffen und vier eigenen/verteidigten/unterstuetzten abgeschlossenen Berichten.
- Genau vier aktuelle Berichtskarten; Archiv erst bei Navigation/Filter/Nachladen/Aktualisieren, kein Archivpolling pro Sync oder aktiver Flotte.
- Wiederverwendung unveraenderter Produktionswerte innerhalb einer Nachholung; Invalidierung nach Forschung, Bau/Rueckbau und Bergungs-Callback.
- Weiterhin eine synchrone Game-command und ein globaler Epoch. Keine neuen Kampfregeln, Jobs, Writer oder Saveformate.
- Lokale historische Befunde: ca. 54 % weniger Snapshotbytes; ein isolierter 24h-Node-Vergleich 43,4 % weniger Nachhol-Wandzeit bei exakt gleichen Ergebnissen aller 14 Spieler. Keine pauschale Cloud-Latenz-/Kapazitaetsgarantie; gehostetes CPU-Limit bleibt bestehen.

## Vor der Freigabe

1. Frisches wiederherstellbares DB-Backup/Restore-Punkt im Supabase-Dashboard bestaetigen und Zeit/Umfang festhalten (einschliesslich benoetigter Auth-/Spieldaten). In diesem PR wird KEIN Datenbank-Backup behauptet.
2. Aktuelle Edge-Version unmittelbar vor Deployment erneut pruefen. Falls sie nicht mehr v45 ist: aktuelle Function erneut sichern, Manifest/Hash und Rollback aktualisieren. Die Sicherung hier wurde aus der deployten Function gelesen, nicht aus einer vermuteten Repo-Version.
3. Release-PR/Checks pruefen. Parallel offene Wartungsmodus- und Architektur-V2-PRs nicht mit aktivieren. Ein spaeterer Wartungsmodus muss auch den neuen Compact-RPC sperren; dieser Patch integriert PR #110 nicht.
4. Vorhandene Cloud-Secrets erhalten. Keine Schluessel in Dateien/Chats kopieren. Deployment ist gesonderter Aktivierungsschritt, kein automatischer Effekt dieses PRs.

## Aktivierung

Sebastian prueft/mergt den PR. Der neue Browsercode bleibt mit dem bisherigen Handler kompatibel, falls Pages vor dem Backend aktualisiert wird.

1. Nur supabase/pvp-snapshot-compact.sql im SQL Editor des Live-Projekts ausfuehren. Voraussetzungen sind die bereits vorhandenen Partner-/PvE-Tabellen und Snapshot-Basis. Die SQL ersetzt keinen bisherigen Snapshot oder Writer und loescht keine Historie.
2. Die Betriebseinstellungen zunaechst auf GAME_COMMAND_SNAPSHOT=legacy und GAME_COMMAND_METRICS_RATE=0 setzen. Das sichert einen expliziten Rueckpfad auch dann, wenn zuvor ein anderer Wert vorhanden war.
3. Die neue vollstaendige Game-command 2026-10-27.01 aus supabase/releases/game-command/2026-10-27.01/game-command.txt als swift-handler/index.ts einsetzen und deployen. Gesamte Datei ersetzen. Gateway-verify_jwt=false wie bei der gesicherten v45 beibehalten; der Handler validiert weiterhin auth.getUser(token). Keine Service-Role im Browser.
4. Login/Sync und einen Bauauftrag im Legacy-Modus pruefen, dann GAME_COMMAND_SNAPSHOT=compact aktivieren. Erst bei erfolgreicher SQL und korrektem Handler umschalten. Optional GAME_COMMAND_METRICS_RATE=0.05 fuer eine kurze Messphase (5 % der Auftraege), spaeter wieder 0. Fuer gezielte einzelne Tests bei Bedarf voruebergehend 1, nicht dauerhaft.
5. Browser Strg+F5; Login/Sync, Bau/Forschung, Route/Pause/Fortsetzen/Reload, PvE/PvP, Bergung/Depot, voller Rueckkehrer mit gebundener Ladung sowie vier Berichtskarten und Archiv/Replay pruefen. Status/CPU-Abbrueche/Retryrate und Latenzen beobachten. Bei Auffaelligkeiten Rueckfall statt wiederholter Deploy-Versuche.

SQL Editor: https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/sql/new
Edge Function: https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/functions/swift-handler
Backup-Verwaltung: https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/database/backups

## Rollback Stufe 1: bisheriger Snapshot

Mit authentifizierter vorhandener Supabase-CLI aus dem Repo:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\rollback-server-optimization.ps1 -Mode Snapshot

Falls die CLI nur im lokalen Docker-Projekt installiert ist, deren vollstaendigen .cmd-Pfad mit -SupabaseCli angeben. Das Skript aendert ausschliesslich GAME_COMMAND_SNAPSHOT=legacy und GAME_COMMAND_METRICS_RATE=0 fuer das feste Live-Projekt. Neue Anfragen/Logs pruefen: Secret-Aenderungen koennen Worker neu laden und laufende Anfragen beeinflussen. Es aendert weder gespeicherte Spielstaende noch die Website. Die neue Routenoptimierung bleibt dabei aktiv.

## Rollback Stufe 2: vorheriger Servercode und Website

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\rollback-server-optimization.ps1 -Mode Function

Das Skript prueft vor jedem Cloud-Aufruf die SHA256 der gesicherten v45, setzt Legacy/keine Metriken und deployed exakt diesen Code mit unveraenderter Gateway-Auth in swift-handler. Die neue Supabase-Deploymentnummer wird nicht wieder 45 sein; entscheidend sind die gesicherten Bytes. Es fuehrt keine SQL und keinen DB-Restore aus. CLI muss bereits normal am richtigen Konto authentifiziert sein. Keine CLI-Installation oder Schluesselsuche durch das Skript.

Website: im gemergten Optimierungs-PR auf GitHub Revert verwenden, Ruecknahme-PR pruefen/mergen und Pages-Deployment abwarten. Alternativ den Mergecommit dieses einen PRs mit git revert -m 1 rueckgaengig machen und als PR bereitstellen. Keine pauschale Ruecksetzung auf einen alten main, die spaetere fremde Aenderungen loescht. Festgehaltener Vorherstand: c56f89c9f87effc5b61cf835fc0f9cd4a2dedcdb. Nach Rueckfall Browser neu laden, Login/Sync und laufende Flotten pruefen.

Die zusaetzliche Compact-Funktion kann ungenutzt bestehen bleiben. Nicht sofort droppen, solange alte Worker noch laufen koennten. Normaler Code-Rollback erhaelt zwischenzeitliche Spieleraktionen. DB-Restore nur bei separat nachgewiesenem Datenfehler und nach Bewertung verlorener neuer Aktionen.

## Rueckfallartefakte und Nachweise

supabase/rollback/2026-10-27-v45/game-command.ts und game-command.txt sind die am 27.10. gelesenen deployten Bytes. deployment.json enthaelt Projekt, Deploymentnummer, Gateway-Flag, Source-SHA256 und Deploymentbundle-Hash. Es enthaelt KEINE Sicherung von Secretwerten und KEIN DB-Backup. Unveraenderte Secretwerte werden bei neuen Deployments beibehalten.

Live-Build und TS/TXT-Archiv: Version 2026-10-27.01, SHA256 c4c43d9c3ef7f2b4f19650fba77e8a021f930f41ffd69a55ce20ca27503b1673. Alle fuenf Ausgabedateien sind bytegleich; Live-Flugfaktor bleibt 3. Quellstand: 19fd3dfb973b3a7083cea1995a5ba36ae5f8e578. Das beschleunigte Test-Bundle wird nicht verwendet.

Pruefstand: Website-Build erfolgreich; 536 von 537 Tests bestanden im isolierten Lauf. Der dort wegen fehlendem Get-FileHash gescheiterte Windows-Rollbacktest wurde anschliessend in regulaerer Windows-Umgebung erfolgreich nachgeprueft (beide Rollbacktests gruen). Live-Smoke-Test nach Aktivierung steht noch aus. Kein DB-Backup angelegt und kein Live-Deployment vorgenommen. Metrikdateien koennen lokal mit node scripts/summarize-command-metrics.mjs <metrics.jsonl> ausgewertet werden.

## News-Entwurf (nicht veroeffentlicht)

⚙️ Wir entlasten die Serverabgleiche: Aktive Flotten bleiben vollstaendig beruecksichtigt, waehrend alte Kampfberichte erst beim Nachschauen geladen werden. Die Vorschau zeigt die letzten vier Angriffe oder Verteidigungen. Handelsrouten werden effizienter nachberechnet. Flugzeiten, Kampfregeln und gespeicherte Berichte bleiben erhalten.
