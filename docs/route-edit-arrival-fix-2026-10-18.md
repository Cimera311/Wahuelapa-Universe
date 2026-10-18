# Cloud-Ladefehler bei vorgemerkten Routenänderungen

Die Live-Diagnose meldet `processed/SV057`: Die Stoppreihenfolge und die Positionsfelder einer Handelsroute widersprechen sich nach der Verarbeitung. Der Fehler ist mit vier Regressionstests vor dem Fix reproduziert; dieselben Tests bestehen nach der Korrektur.

## Ursache und Änderung

Eine vorgemerkte Änderung kann den letzten Stopp einer laufenden Route ersetzen. Bei Rückkehr zum Heimatplaneten übernimmt die Engine die neue Stoppliste. Bisher wurden die Positionsfelder nur bei bereits pausierten Routen angepasst. Wenn die gerade angekommene Route wegen Treibstoffmangel oder einer gewünschten Pause stehen bleibt oder nach dem Beenden auf Lagerplatz wartet, blieb `from` beim alten letzten Stopp. Die strenge Spielstandprüfung lehnt diesen widersprüchlichen Zustand ab. Da der Cloud-Abgleich die gemeinsame Welt verarbeitet, kann dies auch das Laden anderer Spieler blockieren.

Beim Aktivieren einer Änderung am Heimatplaneten werden nun immer `index = 0`, `to = home` und `from = letzter neuer Stopp` gesetzt. Beim nächsten Abflug setzt die bestehende Fluglogik wieder die tatsächlichen Flugfelder. Es werden keine Schiffe oder Waren verschoben und keine Flugzeit oder Treibstoffkosten rückwirkend geändert.

Die Validierung bleibt unverändert. Weder Spielstände noch Berichte müssen gelöscht werden. Dies korrigiert den reproduzierten Fehler; die erfolgreiche Wiederaufnahme der konkreten Live-Welt muss nach dem Deploy bestätigt werden.

## Aktivierung

1. PR mergen und Pages-Build abwarten.
2. **Keine SQL erforderlich.**
3. [Vollständige Game-command 2026-10-18.03 als TXT](https://raw.githubusercontent.com/Cimera311/Wahuelapa-Universe/codex/route-edit-arrival-fix-2026-10-18/supabase/releases/game-command/2026-10-18.03/game-command.txt) öffnen.
4. In der bestehenden Supabase-Funktion **swift-handler** den Inhalt von **index.ts vollständig ersetzen** und deployen. Funktionsname und Auth-Einstellungen beibehalten.
5. Spiel aktualisieren und „Cloud-Stand laden“. Bei erneutem Fehler Diagnosecode prüfen. Die Diagnose-Erweiterung aus 2026-10-18.02 bleibt enthalten.

## Prüfung

Vier neue Regressionstests prüfen Treibstoffmangel, manuelle Pause, Beendigung mit Restladung und den Cloud-Abgleich eines anderen Spielers mit dem deploybaren Bundle. Vor dem Fix scheitern alle vier mit `processed/SV057`. Nach dem Fix bestehen sie. Die Tests prüfen außerdem unveränderte Eingangsdaten, Erhalt der Schiffszahlen, erhaltene Restladung und ausbleibende doppelte Rundenzählung. Bestehende Tests für gemischte Routen und Routenstatistiken bestehen ebenfalls.

## Deutscher News-Entwurf (noch nicht veröffentlicht)

🛠️ **Korrektur beim Cloud-Laden und bei Handelsrouten**

Eine vorgemerkte Änderung der Handelsstopps konnte beim nächsten Heimathalt den Cloud-Abgleich blockieren, wenn die Route anschließend pausierte oder auf freien Lagerplatz wartete. Wir haben die Übernahme der neuen Stoppreihenfolge korrigiert. Eure Flotten, Ladungen und Routenstatistiken bleiben erhalten. Nach der Freischaltung bitte das Spiel neu laden.
