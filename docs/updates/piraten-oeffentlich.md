# Piratenstationen für alle Spieler · 17.10.2026

Fünf persönliche PvE-Ziele sind unter Galaxie → Piraten für alle angemeldeten Spieler verfügbar. Spionagesonden können regulär gebaut werden. Der Coming-soon-Hinweis entfällt bei bestätigter Serverfreigabe. Die News in src/news.js beschreiben Spionage, Angriffe, Beute, Bergung, Bilder und Fluganimationen.

Serverseitig erhalten normale Spieler nur ihre eigenen Stationen, Einsätze und Berichte. Nicht aufgeklärte Flotten und Ressourcen werden auch nicht über die Konfiguration verraten. Realm-Einstellungen bleiben in Oberfläche, Spielserver und SQL ausschließlich Admins vorbehalten. Gäste bleiben ausgeschlossen.

## Aktivierung

1. supabase/pirates-public.sql nach bereits installiertem pirates-admin.sql ausführen. Der Patch ersetzt nur die Commit-Freigabe und erhält vorhandene Stationen, Flüge und Realm-Einstellungen.
2. Die vollständige Game-command 2026-10-17.02 als index.ts der bestehenden Funktion swift-handler deployen. Bestehende Auth-Einstellungen beibehalten; die Funktion validiert Benutzer weiterhin über auth.getUser.
3. Den geprüften PR mergen und das GitHub-Pages-Deployment abwarten. Spiel neu laden; gegebenenfalls den Serverstand aktualisieren.

Die neue Oberfläche öffnet den Bereich für normale Spieler erst bei features.piratesPublic vom aktualisierten Spielserver. Ein alter Server lässt sie weiterhin gesperrt. Es werden keine Spielerstände zurückgesetzt.
