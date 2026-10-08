# Kleine Anmeldung mit Cloud-Spielständen

Der Code ist vorbereitet, aber **noch nicht aktiviert**. Die Seite bleibt auf GitHub Pages. Supabase übernimmt ausschließlich Anmeldung und private Spielstände. Es ist kein eigener Server nötig.

## Einmalige Einrichtung durch Sebastian

1. Auf https://supabase.com/dashboard ein Projekt im **Free-Tarif** erstellen. Keine kostenpflichtige Option auswählen. Ein Datenbankpasswort festlegen und privat aufbewahren.
2. Im **SQL Editor** den Inhalt von [`supabase/setup.sql`](supabase/setup.sql) ausführen.
3. Unter **Authentication → URL Configuration** als **Site URL** und erlaubte **Redirect URL** genau `https://cimera311.github.io/Wahuelapa-Universe/` eintragen. E-Mail/Passwort als Anbieter aktiv lassen; E-Mail-Bestätigung eingeschaltet lassen. Das Passwortminimum auf mindestens 8 Zeichen setzen.
4. Aus **Connect / API Keys** die **Project URL** und den **Publishable Key** kopieren. Diese beiden öffentlichen Werte können im Browser verwendet werden. **Keine Secret Keys, keinen service_role-Key und kein Datenbankpasswort weitergeben oder ins Repository schreiben.**
5. In `src/cloud-config.js` URL und Publishable Key eintragen, `enabled:true` setzen und committen. Sebastian kann mir alternativ diese zwei öffentlichen Werte geben, damit ich die Konfiguration ergänze.

Nach der Pages-Veröffentlichung erscheint unter dem Zahnrad und auf dem Startbildschirm **Anmelden / Konto erstellen**. Registrierung mit E-Mail und Passwort; Bestätigungsmail öffnen und anmelden. Beim ersten Login lokalen Fortschritt bewusst übernehmen oder ein neues Imperium anlegen. Ein bereits vorhandener Cloud-Spielstand wird geladen. Freunde registrieren eigene Konten auf derselben Spielseite.

## Verhalten und Grenzen

- Eigener Spielstand je Konto. Browserlokaler Gast-Spielstand bleibt getrennt erhalten.
- Lokale Sicherung nach Aktionen, Cloud-Sicherung nach Aktionen mit kurzer Verzögerung und während des Spiels ungefähr alle 30 Sekunden. **Jetzt Cloud speichern** sichert vor einem Gerätewechsel; Abmelden wartet auf erfolgreiche Sicherung.
- Beim erneuten Login wird die Offline-Produktion nachberechnet. Nicht übertragene lokale Änderungen werden wiederverwendet, wenn die Cloud-Revision unverändert ist. Bei Abweichung stoppt das Spiel und bietet Export oder bewusstes Laden des Cloud-Stands.
- Verbindungsprobleme werden angezeigt; lokale Sicherung und Export bleiben verfügbar. Wer vor der ersten Übertragung den Browser löscht oder wechselt, hat dort noch keine Cloud-Sicherung.
- Gleichzeitig spielende Geräte überschreiben sich nicht still: Der Server prüft und erhöht die Revision atomar. Bei Konflikt den lokalen Stand bei Bedarf exportieren, anschließend **Cloud-Stand laden**. Keine automatische Zusammenführung.
- Datenbankzugriff ist mit Row Level Security auf die angemeldete Person begrenzt. Schreibzugriffe erfolgen nur über die SQL-Funktion mit `auth.uid()`. Ein öffentlich sichtbarer Schlüssel ersetzt diese Regeln nicht.
- Die Spielsimulation bleibt clientseitig und manipulierbar. Das ist für private Solo-Spielstände akzeptiert; ein faires öffentliches Leaderboard benötigt später serverseitig geprüfte Spielaktionen.
- Noch keine Rangliste, Raids oder eigene Passwort-zurücksetzen-Oberfläche. Für verlorene Zugänge vorerst die Supabase-Administrationsfunktionen verwenden.
- Der SDK wird nur bei aktiver Cloud-Funktion von jsDelivr geladen (fest auf Version 2.117.2 gesetzt). Gastmodus hat keine externe Laufzeitbibliothek.
- Supabase Free unterliegt aktuellen Limits und kann inaktive Projekte pausieren. Für erste Tests mit Freunden vorgesehen, ohne Verfügbarkeitsgarantie. Keine kostenpflichtigen Dienste wurden angelegt.

## Prüfung

`npm test`: 22 Tests, darunter drei Controllerprüfungen für lokale Wiederherstellung, Konfliktauflösung und Abmeldung sowie sechs Cloud-Adaptertests mit simuliertem Backend für Kontentrennung, Revisionen, konkurrierende Geräte, Netzfehler, verlorene Speicherbestätigungen und beschädigte Spielstände. `npm run build` erfolgreich. SQL und echte E-Mail-Anmeldung müssen nach Anlegen des Projekts zusätzlich geprüft werden; ein echtes Supabase-Projekt und ein ausführbarer Browser standen für diesen Schritt nicht zur Verfügung.

Offizielle Referenzen: [Auth](https://supabase.com/docs/guides/auth), [API Keys](https://supabase.com/docs/guides/getting-started/api-keys), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Free-Tarif und Limits](https://supabase.com/docs/guides/platform/billing-on-supabase).

## Gemeinsame Rangliste

Nach `setup.sql` einmal den vollständigen Inhalt von [`supabase/leaderboard.sql`](supabase/leaderboard.sql) im Supabase SQL Editor als neue Abfrage ausführen. Danach Spielseite neu laden und unter **Rangliste → Aktualisieren** öffnen. Bereits vorhandene Cloud-Spielstände erscheinen automatisch; kein neuer Account und keine Datenmigration nötig.

Die Rangliste ist nur für angemeldete Spieler lesbar. Sie zeigt Top 100 plus den eigenen Rang, Commander-Namen, Punkte, Kolonien und Punkteaufteilung. E-Mails, Konto-IDs und vollständige Spielstände werden nicht zurückgegeben. Die privaten Zugriffsregeln von `game_saves` bleiben bestehen. Gleiche Punkte teilen denselben Rang.

Punkte: je 100 Ressourcen in fertigen Gebäudestufen, Forschungen bzw. vorhandenen Schiffen, pro Bereich abgerundet, dann addiert. Startgebäude zählen mit. Fliegende Schiffe zählen weiter; nach einer Kolonisierung zählt das verbrauchte Kolonieschiff nicht mehr. Lagerbestände und unfertige Aufträge zählen nicht. Beim Öffnen bzw. über Aktualisieren wird der letzte Cloud-Stand verglichen; keine permanente Simulation anderer Spieler.

Die Punkte werden serverseitig aus gespeicherten Zuständen berechnet, aber diese Zustände stammen weiterhin aus dem Browser. Diese Freundesrangliste ist **nicht manipulationssicher**. Für einen fairen öffentlichen Wettbewerb sind weiterhin serverseitig geprüfte Aktionen nötig.

Prüfung: `npm test` (26 Tests), `npm run build`. Zusätzlich wurde das SQL unter PostgreSQL/PGlite auf Kostenberechnung, fliegende Schiffe, unfertige Gebäude, Gleichstände, Top-100 plus eigenen Rang, private Spielstände und Zugriffsrechte geprüft. Reproduzierbar mit temporärem `npm install --no-save --package-lock=false @electric-sql/pglite` und `node scripts/check-leaderboard.mjs`. Die echte Supabase-Funktion muss nach der einmaligen Einrichtung noch geprüft werden.
