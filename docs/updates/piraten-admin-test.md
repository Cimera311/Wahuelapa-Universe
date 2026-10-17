# Persönliches PvE – Admin-Test

## Aktivierung

1. `supabase/pirates-admin.sql` im Supabase SQL Editor ausführen. Die Datei ist wiederholbar und setzt keine Spielstände oder Stationen zurück. Sie setzt die vorhandene PvP-/Partnerschaftsinfrastruktur voraus und wird nach den bisherigen Ranking-Patches installiert. Ältere SQL-Patches danach nicht erneut ausführen, da sie die erweiterten Wrapper überschreiben könnten.
2. In der **bestehenden Funktion `swift-handler`** den Inhalt von `index.ts` vollständig durch die komplette `game-command.txt` aus Release **2026-10-17.01** ersetzen und deployen. Funktionsname, Secrets und bestehende Auth-/JWT-Einstellungen beibehalten. Keine zweite Funktion anlegen.
3. Den PR nach Prüfung mergen, Pages-Deployment abwarten und das Spiel aktualisieren.

SQL vor Game-command; Website danach. Der bisherige Handler kann während des kurzen Übergangs normale Aktionen weiter verarbeiten. Nicht auf einen alten Handler zurückstellen, sobald neue PvE-Missionen gestartet wurden.

## Erster Probeangriff

- Als Admin **Galaxie → Piraten** öffnen. Die persönlichen Stationen werden initialisiert. Normale Spieler bleiben bei „Coming soon“ gesperrt; die API prüft ebenfalls die Admin-Liste.
- **Schmugglernest** auswählen und den gewünschten **Startplaneten** einstellen. Bei Start aus dem Heimatsystem sind keine Galaxiekolonie und kein interstellarer Antrieb erforderlich.
- **Spionagesonde bauen** oder unter Flotten → Hangar → Schiffswerft → Sonden & Kolonie bauen. Eine Sonde kostet 150 Metall / 120 Kristall / 40 Treibstoff und benötigt Schiffswerft 1 + Sensortechnik 1. Das vorhandene Sondenbild dient als Platzhalter.
- Mit ausreichender Sensortechnik eine **Spionagesonde senden**. Verbrauch und Flugzeit sind vorher sichtbar. Erst bei Ankunft gibt es Flotte, Verteidigung, Forschung und Ressourcen. Die Sonde kehrt zurück.
- Auftrag **Angriff** wählen, verfügbare Kriegsschiffe und bei Bedarf Frachter auswählen. Risikohinweis bestätigen und starten. Der Angriff nutzt echte Schiffe, Forschung, Treibstoff, Hüllenschäden und die beim Start aktive Kampfengine. Die Startflotte und Regeln werden festgehalten. Ein Kampf ist auch ohne Scan möglich.
- **Serverstand aktualisieren**, sobald eine Flugzeit abgelaufen ist. Offline-Ankünfte werden bei jedem normalen Serverabgleich ebenfalls nachgeholt.
- Ergebnisse unter **PvE-Kampfberichte** ansehen. Schiffe kehren nach der zweiten Strecke zurück. Bei vollem Lager bleibt Restladung an Bord und die Flotte gebunden. Freier Lagerplatz löst die Rückgabe genau einmal aus.
- Nach einem Sieg: verbliebene Depotressourcen mit Auftrag **Depot abholen**, Trümmer separat mit **Trümmer bergen** holen. Normale Frachter sind dafür geeignet. Bergungsfrachter werden von erneuerten Piraten nicht angegriffen; eine Depotabholung nach Erneuerung kehrt leer zurück.

## Regeln und Faktoren

- Fünf persönliche, voneinander unabhängige Stationen. Keine öffentlichen Ziele oder NPC-Angriffe auf Spieler.
- Standard: 60 Minuten Cooldown pro Spieler und Station ab Kampfeintritt. Eine zweite Angriffswelle im Anflug auf dasselbe Ziel wird abgewiesen. Eine gebundene Angriffsflotte belegt einen normalen Angriffsplatz; andere Stationen bleiben nach verfügbarer Kapazität angreifbar.
- Erneuerung ersetzt Besatzung und Depot, entfernt aber vorhandene Trümmer nicht. Ein gestarteter Angriff hält seine Zielgeneration bis zum Kampf fest. Scans sind Momentaufnahmen und werden bei Kampf/Erneuerung ungültig.
- Die Beute ist das noch vorhandene Depot, begrenzt durch den überlebenden Laderaum. Es gibt keine automatische Trümmeraufnahme beim Angriff. Ressourcen werden nicht doppelt als Beute erzeugt.
- Trümmer entstehen nur aus neu zerstörten Einheiten, standardmäßig 30 % Metall/Kristall; kein Treibstoff. Sie verfallen standardmäßig nach 24 Stunden ohne neuen Trümmerzugang. Der Ablauf wird angezeigt.
- Unter **Realm-Einstellungen · Admin** kann die vollständige JSON-Konfiguration gespeichert werden. Sie liegt persistent in der Datenbank und gilt realmweit. Defaults und Validierung: `src/pirates-config.js`.
- `strengthFactor`, `resourceFactor`, `flightTimeFactor`, `fuelFactor` (0.1–20), `cooldownMinutes` (1–1440), `debrisRate` (0–1), `debrisLifetimeHours` (1–168), `maxMissions` (1–50), `enabled` sowie `stations.<id>.enabled/sensor/fleet/resources/tech` sind konfigurierbar. Für kurze Testflüge etwa `flightTimeFactor: 0.1` setzen; für den normalen Stundenrhythmus `cooldownMinutes: 60` lassen.
- Stärke/Beute/Sensoranforderungen/Forschung/Trümmerregeln ändern sich mit der nächsten Stationsgeneration; Flugfaktoren gelten für neu gestartete Einsätze. Laufende Missionen behalten Zeit, Kosten und Kampfregeln.
- Persönliche Flotten bleiben während PvE-Flügen in der Rangliste enthalten. Rückkehrer, die vor einer gemeinsamen Kolonie auf Lagerplatz warten, nehmen an deren PvP-Verteidigung teil und sind dort angreifbar.

## Sicherheit und Verifikation

Keine direkten Tabellenrechte für Browserrollen; PvE-Zustand wird nur über die bestehende autoritative Servergrenze verarbeitet. Projektionen enthalten ausschließlich eigene Stationen, Missionen und Berichte. Eine Scananzeige gibt keine ungeklärten Stationsbestände aus. Admins können zur Konfiguration die Realm-Grundwerte sehen; diese sind kein Ersatz für einen aktuellen Stationsscan.

Abgedeckt sind echte SQL-Installation und Wiederholung, Rechte, optimistische Transaktionen, Antwortwiederholung ohne doppelte Zahlung/Belohnung, Ranglistenwerte, Scan-Ankunft, Kampf, Rückkehr, Lagerstau, Cooldown, Erneuerung, Bergung und reale Formular-Dispatches. Bilder und öffentliches PvE werden nicht freigeschaltet. Eine visuelle Browserprüfung war in dieser Umgebung nicht verfügbar.

## News-Entwurf – noch nicht veröffentlichen

🏴‍☠️ **Die Piraten bekommen Gegenwind!**

Unser PvE-Bereich wird zunächst intern von Admins getestet: persönliche Piratenstationen in fünf Stärken, Spionagesonden, echte Kämpfe und anschließende Beute- und Trümmerbergung.

Unter **Galaxie → Piraten** bleibt für alle anderen vorerst **Coming soon** stehen. Die Freischaltung folgt nach den Tests und der Abstimmung der Belohnungen. 🚀
