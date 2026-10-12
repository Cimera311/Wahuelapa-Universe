# Game-command-Versionen und Rollback

Jeder unterschiedliche Dashboard-Code-Stand erhält einen eigenen Ordner `YYYY-MM-DD.NN`. Darin liegen das vollständige `game-command.ts`, eine bytegleiche `game-command.txt` fürs Handy und `release.json` mit Beschreibung, Quell-Commit, Datum und SHA-256-Prüfsumme. Bestehende Versionsordner werden nicht überschrieben. GitHub bewahrt zusätzlich ihre Commit-Historie.

Die [Versionsübersicht](index.json) listet alle Stände; `latest` bezeichnet den aktuellen archivierten Code. Die Dateien [game-command.ts](../../dashboard/game-command.ts) und [game-command-gesamt.txt](../../dashboard/game-command-gesamt.txt) bleiben die gewohnten Downloads für den aktuellen Stand.

Die ersten neun Versionen wurden rückwirkend aus der `main`-Historie übernommen. Ihre Daten sind die Quell-Commit-Zeiten und keine bestätigten Supabase-Deployment-Zeiten. Zwischenstände aus nicht gemergten Entwicklungsbranches sind nicht enthalten. Ein Website-Update ohne Backend-Änderung erzeugt keine neue Game-command-Version.

## Schnell zurückrollen

1. Passenden Versionsordner öffnen und die vollständige `game-command.txt` herunterladen. Beschreibung und Quell-Commit stehen in `release.json`.
2. In Supabase **Edge Functions → swift-handler → Code** den Inhalt der vorhandenen `index.ts` vollständig durch diese TXT ersetzen. Funktionsname und bestehende Auth-Einstellungen beibehalten.
3. **Deploy function** anklicken und einen passenden Flottenauftrag bzw. die betroffene Funktion prüfen. Das Zurücksetzen eines Website-PRs allein verändert die Edge Function nicht.

Vor einem größeren Versionssprung müssen Website, Datenbank und gespeicherte Spielstände zum alten Code passen. Das Code-Archiv setzt weder SQL-Migrationen noch Spielstände zurück. Alte SQL-Dateien nicht zum Rollback erneut ausführen; die Migrationen verändern gemeinsame Commit-/Snapshot-Funktionen und können neuere Funktionen überschreiben. Bei Unsicherheit zunächst einen kompatiblen Fix auf dem aktuellen Stand erstellen.

Für die ersten Stände gelten die jeweils zugehörigen damaligen Migrationsanleitungen im Quell-Commit. Ab `2026-10-10.04` werden außerdem die Partnerschafts-Migration und bestehende PvP-/Berichts-/Kampfprotokoll-Migrationen benötigt. Ab `2026-10-11.01` gilt zusätzlich die Anleitung [FLOTTEN_UPDATE_DEPLOYMENT.md](../../dashboard/FLOTTEN_UPDATE_DEPLOYMENT.md) mit `fleet-planning.sql`. Ein alter Stand unterstützt neu eingeführte Aktionen oder gespeicherte Flottenformate unter Umständen nicht.

Ab `2026-10-11.02` bleiben nicht abladbare Ressourcen an Bord. Die [Deployment- und Rollback-Hinweise](../../dashboard/CARGO_RETENTION_DEPLOYMENT.md) erklären die neuen Wartezustände und deren Grenzen beim Rückwechsel auf ältere Save-Validatoren. Es ist keine zusätzliche SQL-Migration erforderlich.

Ab `2026-10-11.03` können Partnerflotten auch von privaten Planeten starten. [Deployment und Rollback](../../dashboard/PARTNER_ORIGINS_DEPLOYMENT.md) beschreiben die Voraussetzung für einen Rückwechsel auf ältere Herkunftsprüfungen.

Ab `2026-10-11.04` speichert die Werft ihre bezahlten Folgeaufträge. [Deployment und Rollback](../../dashboard/SHIP_QUEUE_DEPLOYMENT.md) erklären die neuen Warteschlangen und warum sie vor einem Rückwechsel abgearbeitet oder erstattet werden müssen. Keine neue SQL-Migration.

Ab `2026-10-11.05` richtet sich die Zahl neuer Werftaufträge nach der Werftstufe, maximal 20. Bereits bezahlte Aufträge bis zur früheren Grenze von 50 bleiben gültig. [Deployment-Hinweise](../../dashboard/SHIP_QUEUE_LEVELS_DEPLOYMENT.md).

## Neue Version erstellen

Änderungen gehören in die ursprünglichen Module, nicht in ein archiviertes Bundle. Nach dem Bündeln zuerst beide Dashboard-TXT-Dateien bytegleich aktualisieren und anschließend archivieren:

```sh
cp supabase/dashboard/game-command.ts supabase/dashboard/game-command-gesamt.txt
cp supabase/dashboard/game-command.ts supabase/dashboard/game-command-werft.txt
npm run game-command:archive -- 2026-10-12.03 "Beschreibung der Backend-Änderung"
npm test
```

Bei einer zweiten Version am selben Tag `.02`, dann `.03` usw. verwenden. Der Befehl schreibt einen neuen Ordner und aktualisiert `index.json`. Er verweigert bestehende Versionsnummern, bereits archivierte Code-Stände und voneinander abweichende TS-/TXT-Dateien. Der Quell-Commit ist `HEAD` beim Archivieren: Quelländerungen daher zuvor committen, danach das generierte Bundle und Archiv ergänzen.

Bundle, Archiv und Index im selben PR auf GitHub ablegen. Die normale Test-Pipeline prüft alle Prüfsummen, Metadaten, TS-/TXT-Gleichheit und die Übereinstimmung des aktuellen Bundles mit `latest`. Ein neuer Dashboard-Stand ohne Archiv schlägt damit in CI fehl. Vor dem manuellen Supabase-Deploy muss dieser Stand auf GitHub verfügbar sein.
