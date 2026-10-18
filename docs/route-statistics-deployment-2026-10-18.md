# Handelsrouten: Aktivität und Statistik

## Aktivierung

1. PR mergen und erfolgreichen Pages-Build abwarten.
2. **Keine SQL-Datei erforderlich.** Die Statistik liegt im bestehenden serverseitig verwalteten JSON-Spielstand. Datenbankrechte und Anmeldung bleiben bestehen.
3. In der bestehenden Supabase Edge Function **`swift-handler`** den gesamten Inhalt der Editor-Datei `index.ts` durch `supabase/releases/game-command/2026-10-18.01/game-command.txt` ersetzen und deployen. Den Funktionsnamen und die vorhandenen Auth-Einstellungen beibehalten. Die Funktion prüft das Anmeldetoken selbst.
4. Spiel neu laden. Unter **Flotten → Handel → Routen → Bestehende Routen** erscheinen die letzte Aktivität und die aufklappbare Statistik. Dieselbe Anzeige ist in der Flottenübersicht vorhanden.

Wird die Oberfläche vor dem Backend aktualisiert, zeigt sie einen Hinweis auf die benötigte Serverversion statt unverbindliche Vorschauwerte als verfügbare Statistik auszugeben. Vor dem Backend-Deployment erzeugt der alte Server weiterhin seine bisherigen Routinemeldungen.

## Zählregeln

- Pro aktiver Route gibt es nur einen letzten Aktivitätseintrag und feste Summen, keine wachsende Liste von Stopps.
- `rounds` bleibt die bisherige Gesamtzahl abgeschlossener Runden.
- `stats.since` und `roundsAtStart` kennzeichnen den Beginn der Mengenstatistik. Bei alten Routen ist dies der zuletzt gespeicherte Simulationszeitpunkt vor ihrer ersten Verarbeitung durch die neue Engine; anschließend nachgeholte Ereignisse werden mitgezählt. Frühere Mengen werden nicht geschätzt.
- `loaded` zählt nur die tatsächlich in den Frachter geladenen Ressourcen. `delivered` zählt nur tatsächlich ins Lager entladene Ressourcen. Beides sind getrennte Durchsatzzähler, kein Nettogewinn und keine Summe einzigartiger Güter.
- Teillieferungen, Rückladung und späteres Entladen pausierter oder auf Lagerplatz wartender Routen werden bei der tatsächlichen Übergabe erfasst. Wiederholter Abgleich ohne Übergabe zählt nichts zusätzlich.
- `fuelPaid` ist der für vollständige Runden im Voraus abgebuchte Treibstoff, keine Schätzung des bereits verflogenen Anteils. Bei alten Routen ist der Treibstoff der schon bezahlten laufenden Runde unbekannt und wird nicht nachträglich angesetzt.
- Stopps zählen Ankünfte einschließlich Rückkehr zum Startplaneten, jedoch keinen Start, kein manuelles Fortsetzen und kein späteres Teilentladen am selben Aufenthaltsort.
- Routenänderungen, Pausen und Fortsetzungen behalten die Statistik. Bei endgültiger Beendigung wird die Route wie bisher entfernt; eine einzelne Abschlussmeldung bewahrt die Summen.
- Erfolgreiche Handelsstopps und abgeschlossene Handelsrunden erzeugen keine neuen Einzelberichte. Wichtige bestehende Meldungen zu Pausen, fehlendem Treibstoff, wartenden Änderungen, gebundener Restladung und Beendigung bleiben erhalten.
- Historische Berichte werden in diesem Update **nicht gelöscht**. Diese Änderung stoppt den weiteren Zuwachs durch erfolgreiche Routineereignisse; sie verkleinert keine bestehenden Datenbankdateien.

## Sicherheit und Kompatibilität

Die Serverengine berechnet die Mengen aus den tatsächlichen Materialbewegungen. Vom Client eingereichte Statistikfelder werden nicht übernommen. Neue Felder werden beim Laden validiert; alte Routen ohne Statistik bleiben kompatibel. Die Atomizität, Auftrags-IDs und Versionsprüfung der vorhandenen Serverbefehle bleiben erhalten.

Ein Rollback auf die bisherige Game-command verarbeitet die Spielmechanik weiterhin, aktualisiert aber die neuen Zähler nicht. Für spätere erneute Aktivierung wären solche Statistiklücken zu berücksichtigen; dies ist kein lückenloser Statistik-Rollback.

## News-Entwurf – erst nach Aktivierung veröffentlichen

🚚 **Deine Handelsrouten bekommen eine Statistik**

Unter **Flotten → Handel → Routen** siehst du direkt an jeder Route die letzte Aktivität: Wo wurde gehalten und wie viel wurde tatsächlich geladen oder entladen?

Klappe **Statistik** auf, um gelieferte und geladene Mengen je Rohstoff, abgeschlossene Runden, Stopps und den für Runden bezahlten Treibstoff anzusehen. Deine bisherigen Rundenzahlen bleiben erhalten. Neue Mengenstatistiken haben einen eigenen sichtbaren Startzeitpunkt.

Volle Lager werden berücksichtigt: Restladung zählt erst dann als geliefert, wenn sie wirklich entladen wurde.

Erfolgreiche Handelsstopps und Runden füllen künftig nicht mehr dein Berichtsarchiv. Wichtige Meldungen, etwa zu pausierten Routen oder fehlendem Treibstoff, bleiben erhalten. Beim Beenden einer Route bekommst du eine Abschlussmeldung mit den Summen. 🪐
