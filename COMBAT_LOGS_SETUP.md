# Kampfregeln und vollständige Protokolle (Version 2)

## Aktivieren

1. `supabase/combat-logs.sql` vollständig im Supabase SQL Editor ausführen. Die vorhandene PvP-Migration muss bereits installiert sein. Die Datei ist wiederholbar und berechnet keine alten Kämpfe neu.
2. Den vollständigen Inhalt von `supabase/dashboard/game-command.ts` in die vorhandene Edge Function **swift-handler** kopieren und **Deploy updates** ausführen. Nicht unter einem neuen Namen anlegen. Die vorhandene Authentifizierung bleibt erhalten.
3. Den Website-Stand dieses Branches veröffentlichen und die Seite neu laden.

SQL zuerst installieren: Ohne den Trigger würden neue Protokolle noch in den Angriffsdaten gespeichert. Die SQL-Datei übernimmt solche Protokolle nachträglich; die empfohlene Reihenfolge vermeidet große Spielstand-Abfragen.

## Zielauswahl

Beide Seiten verwenden dieselben Regeln. Solange gegnerische Kriegsschiffe leben, sind Frachter, Sonden und Kolonieschiffe geschützt. Unter den erlaubten Zielen werden zuerst Einheiten mit positivem Schadensbonus gewählt. Andernfalls: zufälliges Kriegsschiff, dann orbitale Verteidigung, dann ziviles Schiff. Bonusziele können deshalb auch Verteidigungen sein, während Kriegsschiffe leben.

Alle zu Rundenbeginn lebenden Einheiten feuern gleichzeitig. Schaden wird erst nach allen Schüssen verrechnet. Ein in dieser Runde zerstörtes Kriegsschiff schützt seine Frachter noch bis zum Rundenende. Überschaden geht verloren und springt nicht auf ein anderes Ziel über. Es bleiben maximal sechs Runden, bestehende Schiffswerte, Forschungsfaktoren, Beute- und Trümmerregeln.

Neue Angriffe speichern Regelversion 2 beim Start. Bereits fliegende Angriffe ohne diese Versionsnummer werden nach den bisherigen Regeln aufgelöst. Alte Berichte erhalten keine erfundenen Schussdaten.

## Gespeicherte Daten

- Stabile Einheiten-IDs, Schiffstyp und Name, damalige Grundwerte und Kosten, Forschung, Schildbereitschaft, Ausgangshülle und Schilde.
- Seed und Regelversion für reproduzierbare Zielwahl.
- Jeder einzelne Schuss: Schütze, Ziel, Schussnummer, Basisschaden, Bonus, Gesamtschaden und Grund der Zielauswahl.
- Jede Runde: Schaden pro Ziel, Schildabsorption, tatsächlicher Hüllenschaden, Überschaden, Zustand davor/danach, Zerstörung und Überlebende beider Seiten.
- Endzustand jeder Einheit und bestehende Zusammenfassung inklusive Beute, Trümmer und Reparaturen.

Die Daten werden atomar mit dem Kampfresultat gespeichert. Wiederholte Speicherung verändert einen vorhandenen Datensatz nicht; abweichende Protokolle werden zurückgewiesen.

## Anzeige und Zugriff

Im Kampfbericht öffnet **Vollständiges Kampfprotokoll** Startzustand, einzelne Runden und Endzustand. Die Ansicht zeigt Flottenübersichten, Hüllenbalken, Trefferberechnung und Zielwahl. Schusslisten werden separat in Seiten mit 200 Einträgen geladen. Ihre Reihenfolge ist keine zeitliche Trefferfolge.

Nur Angreifer und Verteidiger können das Protokoll über `imperium_battle_log` lesen. Die Tabellen sind für direkte Zugriffe gesperrt. Normale Spielstands- und Berichtsabfragen enthalten keine vollständigen Protokolle. Die Protokolle bleiben erhalten, wenn alte Angriffseinträge entfernt werden; beim Löschen eines beteiligten Kontos werden sie mit gelöscht.

Die vollständige Speicherung wächst mit jeder beteiligten Einheit und jedem Schuss. Es gibt keine automatische Löschung oder Kürzung. Für langfristigen Betrieb sollte der tatsächliche Speicherverbrauch beobachtet werden.

## Verifikation

145 automatisierte Tests bestanden, einschließlich realer SQL-Ausführung mit PGlite, Rechteprüfung für beide Beteiligten und einen dritten Nutzer, Seitennavigation, unveränderlicher Speicherung, zivilen Schutzregeln, Bonuszielwahl, Schadensbilanz und alten laufenden Angriffen. Website-Build und Deno-Prüfung von Quelle und Dashboard-Bundle bestanden. Ein Browser-Sichttest und ein Live-Backend-Test stehen bis zur Veröffentlichung aus.
