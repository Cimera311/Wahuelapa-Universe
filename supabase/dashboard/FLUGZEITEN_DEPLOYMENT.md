# Einheitliche Flugzeiten in der gemeinsamen Galaxie

Die serverseitige Edge Function und die Website müssen gemeinsam aktualisiert werden.

1. Den Inhalt der aktualisierten `supabase/dashboard/game-command.ts` im bestehenden Supabase-Editor der **aktuell verwendeten game-command / swift-handler Funktion** ersetzen und deployen. Den vorhandenen Funktionsnamen und die Einstellungen beibehalten.
2. Danach den zugehörigen GitHub Pull Request mergen, damit die Website-Vorschau dieselben Werte verwendet.
3. Website neu laden. Die Serverantwort meldet `pvp.features.flightRules: 4`.

Für den bereits autoritativen PvP-Server ist **keine SQL-Migration erforderlich**. Die Anpassung in `supabase/galaxy.sql` hält lediglich die ältere Installation ohne Edge Function konsistent; diese komplette SQL-Datei nicht zur Aktualisierung des bestehenden PvP-Servers erneut ausführen.

Neue Galaxieflugabschnitte verwenden `max(60 Sekunden, (120 + Entfernung × 45) × 0,78125 / Geschwindigkeit / Antriebsbonus) × galaxyFlightTimeFactor`. Der Faktor ist im aktuellen Hauptrealm in `src/realm-config.js` auf **3** eingestellt: Die ursprüngliche Mindestzeit von 60 Sekunden wird dadurch zu 180 Sekunden. Der Treibstoffverbrauch bleibt gleich. Die Entfernung ist Galaxie-Luftlinie / 40 plus 0,15 je Unterschied der Planetenpositionen. Private Planeten verwenden den persönlichen Galaxie-Eingang mit Position 0. Innerhalb des privaten Tutorialsystems bleibt die bisherige schnelle Formel erhalten.

Handelsrouten haben keinen Zeitaufschlag mehr und behalten den Treibstoffrabatt von 25 %. Alle anderen Missionen zahlen den Verbrauch je Flugstrecke; Hin- und Rückflug werden vorab bezahlt. Fernsonden behalten ihre Rückkehr, Kolonieschiffe ihre Verbrauchsmechanik.

Laufende Flugabschnitte und bereits geplante Rückflüge werden nicht umterminiert. Bei Handelsrouten greift die neue Formel ab dem nächsten startenden Abschnitt; die nächste vollständige Runde wird mit der neuen Entfernung berechnet und bezahlt.

Das aktuelle Dashboard-Bundle `2026-10-12.02` enthält die dreifachen Galaxieflugzeiten. Bei einer späteren Änderung der Realm-Konfiguration müssen Website **und** Supabase-Funktion neu gebaut und veröffentlicht werden. Siehe `REALM_CONFIGURATION.md` im Repository.
