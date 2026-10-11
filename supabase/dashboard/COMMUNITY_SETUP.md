# Chat und Wünsche freischalten

1. Im SQL Editor des bestehenden Supabase-Projekts die Datei `supabase/community.sql` vollständig ausführen. Voraussetzung: `setup.sql` und `pvp.sql` sind eingerichtet. Die Migration ist wiederholbar und verändert keine Spielstände oder Edge Functions.
2. Den Community-Frontend-PR übernehmen. Oben neben **News** erscheinen **Chat** und **Wünsche**.
3. Mit zwei Spieler-Konten prüfen: Nachricht senden, im anderen Konto aktualisieren; Wunsch veröffentlichen und unterstützen. Ein bestehender PvP-Admin kann den Wunschstatus auf **Geplant** oder **Umgesetzt** stellen sowie Beiträge ausblenden.

Nur angemeldete Konten können lesen. Zum Schreiben ist ein vorhandener Commander nötig. Die Datenbank übernimmt dessen Namen, begrenzt Nachrichtengröße und Schreibrate und erlaubt ausschließlich eigene Stimmen. Eigene Beiträge und Admins können Beiträge ausblenden; das ist ein Soft Delete. Private Kontodaten werden nicht ausgegeben. Chat und Wünsche aktualisieren sich alle 15 Sekunden, solange ihr Fenster geöffnet und die Seite sichtbar ist. Ältere Beiträge lassen sich nachladen.

Ohne SQL-Erweiterung zeigt das Frontend einen Einrichtungsstatus und behält fehlgeschlagene Entwürfe im geöffneten Fenster. Es wird kein lokaler Chat als gemeinsamer Chat ausgegeben.
