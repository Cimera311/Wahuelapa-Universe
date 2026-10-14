# Reparaturdock und Hüllenzustand

Dieses Update ergänzt ein Reparaturdock pro Planet, zeigt Hüllenschäden pro Einheitentyp und Standort im Hangar und ersetzt die bisherige Sofortreparatur durch bezahlte, zeitbasierte Aufträge.

## Aktivieren

1. Website-PR mergen; GitHub Pages baut die Oberfläche automatisch. Die neuen Dockaktionen bleiben bis zum Serverupdate gesperrt.
2. `supabase/repair-dock.sql` im Supabase SQL Editor ausführen. Es aktualisiert ausschließlich die private Punkteberechnung; unterwegs befindliche PvP-Flotten und Zugriffsrechte bleiben erhalten.
3. Den aktuellen archivierten Dashboard-Code aus `supabase/releases/game-command/2026-10-14.03/game-command.txt` als vollständige `index.ts` in der bestehenden Funktion **swift-handler** bereitstellen. Bestehenden Funktionsnamen und Auth-Konfiguration beibehalten.
4. Spiel aktualisieren. Auf einem Planeten mit Schiffswerft 2 und Bautechnik 1 das Reparaturdock bauen. Im Hangar beschädigten Typ wählen; Kosten und Zeit kontrollieren, einen Auftrag starten und die Freigabe nach Ablauf prüfen.

## Regeln

- Gebäude: 1.200 Metall, 800 Kristall, 300 Treibstoff; Folgelevel normale Gebäudeskalierung. Energiebedarf wie Schiffswerft, auch im Leerlauf.
- Kosten: 30 % der Metall-/Kristall-Baukosten, anteilig zum fehlenden Hüllenanteil; kein Treibstoff.
- Dauer: 30 % der Basisbauzeit × fehlender Hüllenanteil × 0,92^(Dockstufe−1), anschließend lokale Energieversorgung. Dockbonus wird bei Auftragserteilung festgeschrieben.
- Eine unabhängige lokale Warteschlange mit maximal 20 Aufträgen. Auswahl nach Typ und Anzahl, am schwersten beschädigte zuerst. Fertige Einheiten werden einzeln freigegeben.
- Dockeinheiten bleiben eigene, angreifbare Einheiten und zählen weiter in der Rangliste. Sie können bis zur Freigabe keine Flüge starten. Bei Gefechten verteidigen sie mit ihrer aktuellen Hülle und Schildregeneration.
- Nach einem Gefecht bleiben Überlebende im Dock. Neues Schadensmaterial wird separat angezeigt und muss bezahlt werden, bevor die Arbeit weiterläuft. Zerstörte Einheiten und ihre Materialbudgets werden entfernt.
- Abbrechen erstattet nur ungenutztes, noch vorhandenes Material, auf ganze Rohstoffeinheiten abgerundet. Aktueller Reparaturfortschritt und Hüllenzustand bleiben erhalten. Erstattungsüberschüsse gehen ins Lieferdepot.

## Kompatibilität und Rollback

Vorhandene Hüllenschäden bleiben erhalten. Alte Spielstände erhalten `repairDock: 0` und eine leere Reparaturwarteschlange. Die Kampfwerte und Zielprioritäten bleiben unverändert; auch die alten Kampfregelversionen bleiben abspielbar.

Eine ältere Serverversion kennt die zusätzlichen Dockreservierungen nicht. Nicht einfach auf den alten Code zurückwechseln, solange Reparaturaufträge existieren: erst Aufträge abschließen oder im neuen Code abbrechen. Andernfalls können Dockschiffe für ältere Logik unsichtbar werden. Website und Server gemeinsam zurücksetzen; SQL nicht durch alte Ranglisten-Dateien überschreiben.
