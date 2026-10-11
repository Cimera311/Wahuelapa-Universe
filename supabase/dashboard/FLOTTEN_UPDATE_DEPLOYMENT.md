# Flotten-Update 0.4 bereitstellen

Basis ist main nach PR #13, Commit e642a35542d5a0df67dd19439032d98a16c714d7. Die gemeinsame Backend-Datei enthält sämtliche bisherigen Änderungen. Die drei Entwicklungsbranches sind Zwischenstände; nur der letzte kumulative PR muss gemergt werden.

1. In Supabase SQL Editor **fleet-planning-sql.txt** vollständig ausführen. Voraussetzung ist die bereits installierte Partnerschafts-Erweiterung. Die neue SQL ersetzt ausschließlich die Ranglistenberechnung für neue Forschungsstufen und gemischte Flotten; sie kann erneut ausgeführt werden. **galaxy.sql nicht erneut ausführen.**
2. Den kompletten Inhalt von **game-command-gesamt.txt** in der bestehenden Edge Function **swift-handler** einsetzen und deployen. Name und bisherige JWT-Einstellungen beibehalten. game-command.ts und game-command-werft.txt enthalten denselben Stand; eine der Dateien reicht.
3. Den letzten kumulativen Flotten-PR nach main mergen. Die zwei Zwischenbranches nicht einzeln mergen. GitHub Pages veröffentlicht anschließend Oberfläche und öffentliche news.html.
4. Spiel im Browser neu laden. Partnerrechte und Spielstände bleiben erhalten; laufende Flüge behalten ihre gespeicherten Ankunftszeiten.

## Regeln dieses Updates

- Handelsrouten verbinden ausschließlich eigene Planeten. Pause wird nach der laufenden Runde am Startplaneten aktiv. Schiffe bleiben gebunden und können dort angegriffen werden. Fortsetzen bezahlt den Treibstoff für die nächste Runde. Bei Treibstoffmangel pausiert die Route ebenfalls. Beenden gibt die Schiffe frei.
- Stopps entladen vor dem Beladen. Pausierte Routen übernehmen Änderungen sofort; laufende beim nächsten Heimstopp. Fehlende Ersatzschiffe verhindern die Änderung, ohne den bisherigen Bestand zu verlieren.
- Militärtechnik 1–4: ein Platz; 5–9: zwei; 10: vier. Hin- und Rückflug belegen den Platz. Ein völlig vernichteter Angreifer gibt ihn nach der Schlacht frei. Das bisherige Tageslimit entfällt, das tägliche Beutebudget je Zielkolonie bleibt bestehen.
- Militärtechnik-Kosten wachsen bis zum Kauf von Stufe 5 mit Faktor 1,6; danach mit 2,4 je Stufe. Ab Stufe 6 wächst auch die Forschungszeit stärker. Kein zusätzlicher Schadensbonus.
- Antriebe erhöhen Geschwindigkeit um 5 % je Stufe, linear auf die Grundgeschwindigkeit. Jeder Schiffstyp nutzt seine zugeordnete Forschung; das langsamste effektive Schiff bestimmt die Flottenzeit. Die Grundzeit wird mit 0,78125 skaliert, wodurch bisherige Stufe-5-Zeiten erhalten bleiben. Verbrauchsbonus bleibt separat 12 %, gemeinsame Mindestflugzeit 60 Sekunden.
- Keine Werftwarteschlange in diesem Patch. Werftfaktor weiterhin 0,92.

## Prüfung

Simulation, reale Formularereignisse in jsdom, Spielstandvalidierung und SQL-Migration mit PGlite sind automatisiert geprüft. Ein ausführbarer Browser stand hier nicht zur Verfügung; die visuelle Prüfung auf echten Mobilgeräten erfolgt nach Veröffentlichung.
