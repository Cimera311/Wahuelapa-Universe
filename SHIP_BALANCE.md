# Schiffsklassen – Prototyp-Balancing v1

Die Bilder und Rollen stammen aus dem Drive-Konzeptpaket ship-concepts-v1. Kosten, Zeiten, Voraussetzungen und Flugwerte sind ein erster Spielvorschlag; das Konzeptpaket enthält keine ausbalancierten Spielwerte.

| Schiff | Metall | Kristall | Treibstoff (Bau) | Bauzeit/Schiff | Basis-Laderaum | Tempo | Flugverbrauch* | Werft | Forschung | Antrieb |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Kleiner Transporter (bestehend) | 180 | 100 | 40 | 8 s | 1000 | 1,00 | 4 | 1 | Transporttechnik 1 | 0 |
| Kurier | 140 | 80 | 30 | 6 s | 750 | 1,35 | 3 | 1 | Transporttechnik 1 | 0 |
| Karawane | 800 | 450 | 180 | 20 s | 5000 | 0,90 | 12 | 2 | Transporttechnik 2 | 1 |
| Atlas | 2400 | 1400 | 600 | 45 s | 16000 | 0,70 | 28 | 4 | Transporttechnik 3 | 2 |
| Arche | 7600 | 4400 | 2000 | 90 s | 50000 | 0,55 | 70 | 6 | Transporttechnik 5 | 3 |
| Falke | 240 | 150 | 60 | 10 s | 0 | 1,50 | 6 | 1 | Militärtechnik 1 | 0 |
| Wächter | 900 | 600 | 220 | 25 s | 0 | 1,10 | 16 | 2 | Militärtechnik 2 | 1 |
| Donner | 3000 | 1800 | 700 | 55 s | 0 | 0,85 | 40 | 4 | Militärtechnik 3 | 2 |
| Titan | 9500 | 6500 | 2500 | 120 s | 0 | 0,60 | 100 | 6 | Militärtechnik 4 | 3 |

* Treibstoff je Entfernungseinheit und Schiff für eine Strecke, vor Antriebstechnik und Rundung. Frachter-Laderaum steigt um 15 % je Transporttechnik-Stufe, je Schiff abgerundet. Die Flugzeit sinkt mit Antriebstechnik und wird zusätzlich durch den Tempo-Multiplikator geteilt. Pro Flottenauftrag wird ein Schiffstyp eingesetzt; gemischte Flotten gehören zum späteren Kampfsystem.

Militärtechnik erfordert Forschungslabor 2 und Bautechnik 1. Vier Stufen schalten die vier Kriegsschiffklassen frei. Kriegsschiffe sind jetzt baubar und stationierbar; es gibt noch keine Angriffe, Gefechte, automatische Verteidigung oder aktive Eskorten. Daher wurden keine wirkungslosen Kampfzahlen als spielbare Werte eingeführt.

Bestehende Sonden, Kolonieschiffe und kleine Transporter bleiben unter ihren alten Schlüsseln erhalten. Fehlende neue Schiffszähler und Militärtechnik werden beim Laden älterer Version-1-Spielstände mit 0 ergänzt. Alte laufende Missionen behalten ihre bezahlten Flugkosten und Ankunftszeiten.

Alle Frachter sind für Liefern, Abholen, Stationieren und Handelsrouten auswählbar. Frachter unterscheiden sich in Kosten, Laderaum, Geschwindigkeit und Verbrauch. Größere Frachter sparen Treibstoff pro Ladungseinheit, kleinere bleiben für kurze, eilige und wenig beladene Flüge nützlich.

## Rangliste

Für neue Schiffe und Militärtechnik einmal `supabase/ship-tiers.sql` im Supabase SQL Editor ausführen, wenn setup.sql und leaderboard.sql schon eingerichtet sind. Bei einer Neuinstallation enthält `leaderboard.sql` bereits alle neuen Werte. Die Migration aktualisiert nur die private Berechnung der Ranglistenpunkte; sie schreibt keine Spielstände um. Ohne Migration zählt die bestehende Rangliste die neuen Schiffstypen noch nicht.
