# Schiffsklassen – Prototyp-Balancing v1

Die Bilder und Rollen stammen aus dem Drive-Konzeptpaket ship-concepts-v1. Kosten, Zeiten, Voraussetzungen und Flugwerte sind ein erster Spielvorschlag; das Konzeptpaket enthält keine ausbalancierten Spielwerte.

| Schiff | Metall | Kristall | Treibstoff (Bau) | Bauzeit/Schiff | Basis-Laderaum | Tempo | Flugverbrauch* | Werft | Forschung | Triebwerk erforderlich |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Kleiner Transporter (bestehend) | 180 | 100 | 40 | 8 s | 1000 | 1,00 | 4 | 1 | Transporttechnik 1 | Verbrennung 0 |
| Kurier | 140 | 80 | 30 | 6 s | 750 | 1,35 | 3 | 1 | Transporttechnik 1 | Verbrennung 0 |
| Karawane | 800 | 450 | 180 | 20 s | 5000 | 0,90 | 12 | 2 | Transporttechnik 2 | Staustrahl 2 |
| Atlas | 2400 | 1400 | 600 | 45 s | 16000 | 0,70 | 28 | 4 | Transporttechnik 3 | Impuls 2 |
| Arche | 7600 | 4400 | 2000 | 90 s | 50000 | 0,55 | 70 | 6 | Transporttechnik 5 | Hyperraum 2 |
| Falke | 240 | 150 | 60 | 10 s | 0 | 1,50 | 6 | 1 | Militärtechnik 1 | Verbrennung 0 |
| Wächter | 900 | 600 | 220 | 25 s | 0 | 1,10 | 16 | 2 | Militärtechnik 2 | Staustrahl 1 |
| Donner | 3000 | 1800 | 700 | 55 s | 0 | 0,85 | 40 | 4 | Militärtechnik 3 | Impuls 1 |
| Titan | 9500 | 6500 | 2500 | 120 s | 0 | 0,60 | 100 | 6 | Militärtechnik 4 | Hyperraum 1 |

* Treibstoff je Entfernungseinheit und Schiff für eine Strecke, vor Antriebstechnik und Rundung. Frachter-Laderaum steigt um 15 % je Transporttechnik-Stufe, je Schiff abgerundet. Flugzeit und Verbrauch sinken nur durch die dem Schiff zugeordneten Triebwerke; der Tempo-Multiplikator beeinflusst zusätzlich die Flugzeit. Pro Flottenauftrag wird ein Schiffstyp eingesetzt; gemischte Flotten gehören zum späteren Kampfsystem.

Militärtechnik erfordert Forschungslabor 2 und Bautechnik 1. Vier Stufen schalten die vier Kriegsschiffklassen frei. Kriegsschiffe sind jetzt baubar und stationierbar; es gibt noch keine Angriffe, Gefechte, automatische Verteidigung oder aktive Eskorten. Daher wurden keine wirkungslosen Kampfzahlen als spielbare Werte eingeführt.

Bestehende Sonden, Kolonieschiffe und kleine Transporter bleiben unter ihren alten Schlüsseln erhalten. Fehlende neue Schiffszähler und Militärtechnik werden beim Laden älterer Version-1-Spielstände mit 0 ergänzt. Alte laufende Missionen behalten ihre bezahlten Flugkosten und Ankunftszeiten.

Alle Frachter sind für Liefern, Abholen, Stationieren und Handelsrouten auswählbar. Frachter unterscheiden sich in Kosten, Laderaum, Geschwindigkeit und Verbrauch. Größere Frachter sparen Treibstoff pro Ladungseinheit, kleinere bleiben für kurze, eilige und wenig beladene Flüge nützlich.

## Rangliste

Für neue Schiffe und Militärtechnik einmal `supabase/ship-tiers.sql` im Supabase SQL Editor ausführen, wenn setup.sql und leaderboard.sql schon eingerichtet sind. Bei einer Neuinstallation enthält `leaderboard.sql` bereits alle neuen Werte. Die Migration aktualisiert nur die private Berechnung der Ranglistenpunkte; sie schreibt keine Spielstände um. Ohne Migration zählt die bestehende Rangliste die neuen Schiffstypen noch nicht.

## Triebwerke und Kolonien

Die bestehende Antriebstechnik heißt nun Verbrennungstriebwerke; ihr Speicherschlüssel `drive` und vorhandene Stufen bleiben erhalten. Sonden, Kolonieschiffe, kleiner Transporter, Kurier und Falke nutzen diesen Antrieb. Karawane/Wächter nutzen Staustrahl, Atlas/Donner Impuls, Arche/Titan Hyperraum. Die drei neuen Forschungen starten bei bestehenden Spielständen mit 0; bereits vorhandene Schiffe und Aufträge bleiben erhalten. Neue Bauaufträge benötigen die neuen Voraussetzungen.

Jeder Antrieb hat 5 Stufen. Forschungsstart: Staustrahl benötigt Verbrennung 3 und Labor 3; Impuls benötigt Staustrahl 3 und Labor 4; Hyperraum benötigt Impuls 3 und Labor 5. Die neue Kriegsschiffklasse benötigt Stufe 1, der neue Frachter Stufe 2.

Antriebsfaktor = `1 + 0.12 × Stufe des passenden Triebwerks`. Flugzeit und Treibstoffbedarf werden durch diesen Faktor geteilt; Sensortechnik verbessert weiterhin zusätzlich Sondenzeiten. Die Boni anderer Triebwerksarten werden nicht addiert.

Kolonisierung 1–3 erlaubt Ferrum, Nereus und Thalassa neben Aurelia (4 Welten gesamt). Kolonisierung 4/5/6 benötigt zusätzlich Staustrahl/Impuls/Hyperraum 1. Diese Plätze sind Vorbereitung für die künftige gemeinsame Galaxie; neue Galaxieziele, Fernsonden und ein interstellares Kolonieschiff sind noch nicht implementiert.

## Sparflug auf Handelsrouten

Jede Routenstrecke dauert 25 % länger und benötigt 25 % weniger Treibstoff als dieselbe Strecke mit demselben Schiff als Direktflug. Dauer und Treibstoff werden je Strecke aufgerundet; bei sehr kleinen Mengen kann die Ersparnis durch Rundung kleiner ausfallen. Routenplanung, Bezahlung und alle tatsächlichen Flugabschnitte verwenden denselben Sparflugmodus. Bereits laufende Flugabschnitte behalten ihre Ankunftszeit und bezahlten Kosten; die nächsten Abschnitte und Runden nutzen die neuen Werte. Keine rückwirkende Erstattung.

Das SQL-Update zählt nun auch alle vier Tutorial-Welten, Kolonisierung bis 6 und alle neuen Triebwerksforschungen.
