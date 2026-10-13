# Orbitalwerft, Runde 0 und reparierbare Verteidigung — Deployment

## Neue Features
- Das bisherige Gebäude `orbital` wird **Orbitalwerft**: gleiche Ausbaukosten und -zeiten wie die Schiffswerft, dauerhafter Energiebedarf auch ohne Auftrag, 8 % kürzere Bauzeit je Ausbaustufe, eigene FIFO-Warteschlange mit einem Auftragsplatz je Stufe und höchstens 20.
- Vier bewaffnete Plattformklassen (Flak, Laser, Railgun, Plasma). Gesamtpreis je bewaffneter Plattform entspricht **pro Rohstoff** Falke, Wächter, Donner, Titan. Die Werft selbst gehört nicht zur Einheitenpreisrechnung. **Keine Gesamtzahlbegrenzung** für Plattformen.
- Militärforschungen wirken auf Plattformen und Schiffe gleichermaßen. Der Donner behält seinen Bonus gegen orbitales Gerät.
- PvP-Regelversion **3**: Runde 0 nur der Beschuss durch Orbitaleinheiten, danach maximal sechs reguläre, simultane Kampfrunden. Bereits gestartete Angriffe bleiben auf Regelversion 1 oder 2 und übernehmen ihre alten Hülle-/Schildwerte.
- Zerstörte Plattformen werden als **Wracks** auf dem ursprünglichen Planeten gespeichert; ein Wiederherstellungsauftrag kostet 70 % der Metall- und Kristallkosten plus 100 % Treibstoff. Überlebende beschädigte Plattformen werden anteilig repariert; ihre Schilde laden weiterhin selbst auf.
- Bereits vorhandene Plattformbestände bleiben ohne Verlust auf dem Planeten. Alte, schon bezahlte Verteidigungsaufträge in der bisherigen Schiffswerft laufen aus oder können zu den damals gezahlten Beträgen storniert werden.

## Reihenfolge — wichtig!

1. **Zuerst Datenbank**: Im Supabase SQL Editor `supabase/orbital-first-strike.sql` ausführen. Das erweitert den gespeicherten Kampfverlauf um Runde **0** und erlaubt PvP-Regelversion **3**. Das Script setzt die bereits installierten `combat-logs.sql` und `combat-log-pagination.sql` voraus.
2. **Ranglistenwertung**: `supabase/orbital-ranking.sql` ausführen. Nur die Kostenwertung für die neuen Plattform- und Werftpreise wird aktualisiert. **Nicht die älteren `leaderboard.sql` oder `ship-tiers.sql` erneut auf Live ausführen.**
3. **Supabase Edge Function**: Das vollständige `supabase/dashboard/game-command-gesamt.txt` des Release `2026-10-13.01` in **Edge Functions → swift-handler → index.ts** kopieren und deployen. Bestehende Function, Secrets und Auth-Einstellungen beibehalten.
4. **Zuletzt Frontend**: PR #45 mergen. Nach GitHub-Pages-Veröffentlichung den Browser aktualisieren.
5. Kurz kontrollieren: Orbitalwerft bei Verteidigung vorhanden, Bau und Wiederherstellung funktionieren, Aufträge laufen auch offline, neue Kämpfe zeigen Runde 0 im vollständigen Kampfprotokoll und in der SQL-Rundentabelle.

**Kein zusätzliches Save-SQL notwendig.** Die Save-Validierung erweitert alte Spielstände beim Laden um die neuen Orbitalfelder. Altbestände und bezahlte alte Werftaufträge bleiben erhalten. Alte angesparte Verteidigungs-Reparaturmaterialien werden beibehalten; sie sind nicht identisch mit neuen Wracks.

## Rollback

Nicht unüberlegt eine alte Game-command-Version installieren, sobald neue Orbitalaufträge oder Wracks gespeichert sind! Frühere Server-Validatoren unterstützen die neuen Strukturen nicht unbedingt; v3-Kampfprotokolle benötigen außerdem die erweiterte SQL-Rundenlogik. Vor einer Rückkehr Save-Kompatibilität und offene Aufträge prüfen. Die additive SQL-Erweiterung nicht durch erneutes Ausführen alter Kampfprotokoll-Migrationen überschreiben.
