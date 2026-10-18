# Cloud-Ladediagnose · Game-command 2026-10-18.02

Der Server meldet beim Cloud-Laden bisher für alle fehlgeschlagenen Spielstandprüfungen denselben Text. Dieses Update liefert zusätzlich die genaue Prüfregel und unterscheidet den gespeicherten Eingangszustand (`stored`) vom nachberechneten Ergebnis (`processed`). Es behebt die fehlende Diagnose; die konkrete Ursache des gemeldeten Ladefehlers ist noch nicht nachgewiesen.

## Aktivierung

1. PR mergen und Pages-Build abwarten.
2. **Keine SQL erforderlich.**
3. [Vollständige Game-command 2026-10-18.02 als TXT](https://raw.githubusercontent.com/Cimera311/Wahuelapa-Universe/codex/cloud-save-diagnostics-2026-10-18/supabase/releases/game-command/2026-10-18.02/game-command.txt) öffnen.
4. In der bestehenden Supabase-Funktion **swift-handler** den Inhalt von **index.ts vollständig ersetzen** und deployen. Funktionsname und vorhandene Auth-Einstellungen beibehalten.
5. Spiel aktualisieren und einmal „Cloud-Stand laden“ drücken. Bei erneutem Fehler den Diagnosecode aus der Fehlermeldung bzw. der Netzwerkantwort festhalten.

Beispiel einer Antwort: `{"error":"Ungültiger oder inkompatibler Spielstand. Diagnose: stored/SV001.","code":"WORLD_SAVE_INVALID","phase":"stored","rule":"SV001"}` (HTTP 503). Dies ist ein Beispiel, kein bereits beobachteter Live-Code.

## Auswertung

- `stored`: Ein gespeicherter Stand scheitert vor der Simulation.
- `processed`: Der Fehler entsteht im Ergebnis der Verarbeitung, etwa durch Nachberechnung, Weltmetadaten oder eine Aktion.
- `SV056` / `SV057`: Routenstruktur bzw. Stoppreihenfolge.
- `SV058` / `SV059`: Neue Routenstatistik bzw. letzte Aktivität.
- `SV061`: Berichte im Spielstand.
- Alle Regeln stehen mit ihrer festen ID in `src/storage.js`; vorhandene IDs bei späteren Änderungen nicht neu nummerieren.

Ein Cloud-Abgleich verarbeitet weiterhin die gesamte Welt. Daher kann auch ein anderer Spielstand den Abgleich blockieren. Die Diagnose enthält keine Spielerkennung und keine Spielstandinhalte. Die Serverlogs enthalten ausschließlich Ereignisname, Fehlercode, Phase und Prüfregel. Fehlerhafte Welten werden weiterhin vor dem Datenbank-Commit abgewiesen. Es werden keine Stände zurückgesetzt, Prüfungen umgangen oder historischen Berichte gelöscht.

## Prüfung

Gezielte Tests prüfen Eingabe- und Ausgabevalidierung, unveränderte Eingangsdaten, ausbleibenden Commit sowie Antwort und Logs des tatsächlich deploybaren Bundles. Zusätzlich vollständige Testsuite und statischer Build.

## Deutscher News-Entwurf (noch nicht veröffentlicht)

🔎 **Bessere Diagnose beim Cloud-Laden**

Falls euer Cloud-Spielstand nicht geladen werden kann, enthält die Fehlermeldung künftig einen kurzen Diagnosecode. Damit können wir die Ursache genauer eingrenzen. Gebt diesen Code bei einer Fehlermeldung bitte mit an. Dieses Diagnose-Update ist noch keine Bestätigung, dass der aktuelle Ladefehler behoben wurde.
