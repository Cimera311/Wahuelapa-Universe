# Flottenmengen und Alle/Keine

## Aktivierung

1. `supabase/combat-log-pagination.sql` im Supabase SQL Editor ausführen. Die vollständige Protokollspeicherung ist bereits installiert. Diese kleine Datei aktualisiert nur die Lesefunktion und ihre Zugriffsrechte. Sie ist wiederholbar und ändert keine Kampfergebnisse.
2. Die vollständige aktuelle `supabase/dashboard/game-command.ts` in die bestehende Edge Function **swift-handler** kopieren und **Deploy updates** ausführen. Eine auf der zuletzt vom Nutzer eingefügten Datei basierende Variante liegt zusätzlich unter `../edge-function-updates/game-command.ts`.
3. Website-Änderungen veröffentlichen und die Seite neu laden.

## Verhalten

Entfernt sind die festen Mengenlimits für Angriffsschiffe (100), Kampfeinheiten je Seite (5.000), Hangarbestände einschließlich ankommender Flotten (5.000), Schiffbau je Auftrag (50), Transport-/Stations-/Handelsflotten (100) und gespeicherte Schiffsbestände je Typ (1 Million). Kampfprotokolle können über den bisherigen Offset von 40.000 hinaus vollständig abgerufen werden; eine Seite lädt weiterhin 200 Einträge.

Im Angriffsformular füllt **Alle** alle verfügbaren Kriegsschiffe und Frachter ein; **Keine** setzt die Mengen auf null. Die ausgewählte Gesamtzahl und die Flugschätzung werden direkt aktualisiert. Handelsflotten und Bauformulare haben ebenfalls keine festen Mengenmaxima mehr.

Verfügbarkeit, positive gültige ganze Zahlen, Ressourcen, Laderaum, Forschungs-/Antriebsvoraussetzungen und Orbitalplätze bleiben geprüft. Die Anzahl gleichzeitiger Missionen und die sechs Kampfrunden werden nicht verändert. Ein Computer kann keine physisch unbegrenzten Flotten berechnen: Laufzeit und Speicherbedarf wachsen mit Einheiten und vollständig gespeicherten Schüssen. Es gibt keine neue künstliche Schiffsmengengrenze.

Zielgruppen werden je Schiffsklasse und Runde zwischengespeichert. Zufallsfolge, Zielpriorität und simultane Schadensermittlung bleiben unverändert.
