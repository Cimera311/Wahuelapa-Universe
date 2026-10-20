# Piraten: sechs Stunden für Stufe 4 und 5

| Stufe | Station | Angriffsabstand ab Kampfankunft |
| --- | --- | --- |
| 1 | Schmugglernest | 60 Minuten |
| 2 | Piratenposten | 60 Minuten |
| 3 | Raubritterhafen | 60 Minuten |
| 4 | Freibeuterfestung | 360 Minuten |
| 5 | Piratenhauptquartier | 360 Minuten |

Der letzte gelesene Live-Realm hatte einen gemeinsamen Wert von 360 Minuten. Der neue Code ergänzt konkrete Werte pro Station, sodass die unteren Stufen trotzdem eine Stunde erhalten. Andere Realm-Faktoren und Gegnerwerte bleiben erhalten. `stations.<id>.cooldownMinutes` ist einstellbar von 1 bis 1440; `null` übernimmt ausdrücklich den globalen Basiswert `cooldownMinutes`.

Bestehende Sperren werden vom ursprünglichen Kampfzeitpunkt aus umgerechnet. Die Uhr beginnt beim Laden nicht erneut. Auch eine unter der alten Stundenregel bereits erneuerte Station bleibt bis sechs Stunden nach ihrem letzten dokumentierten Kampf gesperrt. Depot und Trümmer werden beim Umrechnen nicht neu erzeugt; die reguläre Erneuerung folgt dem neuen Termin. Laufende Flüge werden nicht abgebrochen.

## Installation

1. PR prüfen und mergen.
2. Die aktualisierte vollständige [Game-command (Dashboard-Bundle)](../../supabase/dashboard/game-command.ts) aus diesem PR öffnen (Stand 2026-10-20, inklusive der späteren Änderungen). **Nicht** das ältere Release 2026-10-18.01 verwenden.
3. Im [Supabase-Projekt](https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/functions) die bestehende Funktion **swift-handler** öffnen, den Inhalt von **index.ts vollständig ersetzen** und deployen. Funktionsname und bestehende Auth-Einstellungen unverändert lassen. Keine zweite Funktion anlegen.
4. Nach erfolgreicher Pages-Veröffentlichung und Function-Deployment das Spiel neu laden. Der nächste Serverabgleich übernimmt die vorhandenen Timer und speichert die ergänzten Konfigurationswerte im bestehenden atomaren Verfahren.

**Keine SQL erforderlich.** Die vorhandene Piraten-Persistenz unterstützt die ergänzten JSON-Felder. Dieses Update ist mit dem bisherigen Frontend kompatibel; wirksam wird die Sperre erst durch das Function-Deployment. Die Bereitstellung als PR behauptet keine Live-Aktivierung.

## News-Entwurf – noch nicht veröffentlicht

🏴‍☠️ **Piraten-Balancing: mehr Abstand zwischen den großen Raubzügen**

Die Freibeuterfestung (Stufe 4) und das Piratenhauptquartier (Stufe 5) bekommen einen Angriffsabstand von **sechs Stunden**. Damit bleiben die großen Belohnungen etwas Besonderes. Stufe 1–3 könnt ihr weiterhin jede Stunde angreifen. ⚔️

Der Countdown beginnt beim Kampf an der Station. Bestehende Sperren werden ab eurem letzten Kampf passend umgerechnet – beim Neuladen startet keine neue Wartezeit. Den aktuellen Angriffsabstand und euren Countdown seht ihr unter **Galaxie → Piraten**. Abholung und Trümmerbergung bleiben während der Sperre möglich; wartet dafür nicht bis zur Stationserneuerung. 🚚
