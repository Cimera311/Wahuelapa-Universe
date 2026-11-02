# Daily Piratenjagd – Live-Übergabe (PR #135)

**Stand:** Release-Kandidat; erst deployen, wenn die aktuellen GitHub Actions für den PR vollständig erfolgreich sind. **Nichts wurde durch diesen PR auf Live aktualisiert.**

## SQL: keine Ausführung nötig

Die bestehende Tabelle `public.pirate_world` speichert den Piratenzustand bereits in `data jsonb`. Der neue Queststatus (`dailyQuest`) und der maßgebliche Bonus (`dailyBonus`) werden jeweils im vorhandenen `piratePlayers`-Array gespeichert. Die bestehende SQL-Funktion `public.imperium_pvp_commit` persistiert dieses JSON zusammen mit dem transaktionalen Game-Command-Commit. Kein neues Schema, keine Migration und **kein SQL-Schreibbefehl** nötig.

Der Bonus wird bei `prepareWorld()` aus dem serverkontrollierten Piratenzustand in den berechneten Spielerzustand übernommen. Clientseitig eingeschleuste Bonusfelder dürfen dadurch nicht maßgeblich werden.

## Reihenfolge für den Livegang am PC

1. **Supabase-Sicherung:** Vorher einen Datenbank-Snapshot und die derzeit aktive Edge-Function `swift-handler` (v50 zum Zeitpunkt der Entwicklung) als Rückfalloption sichern. Die bestehende Function bleibt bis zur manuellen Bereitstellung unverändert.
2. **SQL:** nichts ausführen.
3. **Game-Command aktualisieren:** Im Supabase Dashboard unter Edge Functions die bestehende Function **`swift-handler`** öffnen und den gesamten Code durch den Inhalt von `supabase/dashboard/game-command-gesamt.txt` **aus dem PR-Branch** ersetzen. Die Dateien `game-command-gesamt.txt`, `game-command-werft.txt` und `game-command.ts` müssen bytegenau identisch sein. Bestehende Function-Konfiguration (insbesondere die bisherige JWT-Einstellung) nicht verändern. Deployen und die neue ACTIVE-Version kontrollieren.
4. **Nicht unmittelbar mit echten Spielerkämpfen testen:** Zunächst Serverfunktion, Logs und einen regulären angemeldeten Sync prüfen. Die bereits zuvor korrigierte Scan-Persistenz bleibt enthalten.
5. **PR #135 nach grünem CI mergen.** Das vorhandene `.github/workflows/pages.yml` führt auf `main` automatisch `npm ci`, `npm test` und `npm run build` aus und deployed die Website erst bei erfolgreichem Build. Nicht zusätzlich von Hand `START_HERE.html` deployen.
6. **Smoke-Test im Browser:** Questkarte über Piratenstationen sichtbar → Quest annehmen → PvE-Sieg → Claim-Dropdown mit eigenem Planeten → Bonus in lokaler und globaler Übersicht korrekt dargestellt → nach 12h beendet. Währenddessen Produktion und Lagergrenzen prüfen.

## Feature-Regeln

- Eine tägliche Annahme pro Spieler (UTC-Tageswechsel).
- Sieg zählt nur bei einem Angriff, der **nach** der Questannahme gestartet wurde.
- Belohnung beim manuellen Claim: +5 % alle Ressourcen oder +9 % eine Ressource, auf genau einem frei ausgewählten eigenen Planeten.
- Laufzeit 12 Stunden ab Claim; nicht stapelbar und nicht doppelt claimbar.
- Global zeigt Hinweis auf den tatsächlich begünstigten Planeten, nicht irreführend +5 % auf die komplette Imperiumsproduktion.
- Lokal zeigen nur betroffene Rohstoffe den Badge; Strom- und Lagerregeln bleiben unverändert.
- Der ursprüngliche Piratenscan bleibt bis zum Station-Respawn erhalten.

## Prüfpunkte und Rollback

- Tests: `tests/daily-pirate-quest.test.js`, `tests/daily-quest-integration.test.js`, `tests/daily-release-bundle.test.js` und alle bestehenden Tests.
- Wenn der Browser nach Deploy Fehler meldet, zunächst **keinen weiteren Rollout** durchführen. Alte Function-Version zurückrollen; falls Frontend schon gemergt ist, PR-Revert in GitHub vorbereiten.
- Kein Datenbank-Rollback erforderlich, solange keine Quest-Daten gelöscht werden. Alte Function-Versionen ignorieren neue JSON-Felder.
- Für finale Freigabe: CI auf letztem PR-Commit grün und einmal reale Bedienung nach dem Merge. Automatisierte Tests allein sind kein echter Live-Smoke-Test.
