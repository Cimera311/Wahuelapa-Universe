# Wartungsmodus – Rollout

WICHTIG: Der Schalter wird bei der Installation standardmäßig AUS angelegt. Der PR verändert keine Live-Datenbank; auch nach dem Merge muss SQL manuell installiert werden.

1. **Vorher ein vollständiges Backup** der Datenbank und der aktuellen `swift-handler`-Version anfertigen.
2. `supabase/maintenance-mode.sql` vollständig im Supabase SQL Editor ausführen. Der vorhandene PvP-/Piraten-Code wird durch zwei funktional gleiche SQL-Wrapper mit einem zusätzlichen Wartungs-Guard ersetzt.
3. PR mergen, GitHub Pages veröffentlichen und die Browser aktualisieren. Kein Edge-Function-Deployment nötig: der Schutz greift auch bei älteren `swift-handler`-Versionen, da das SQL die autoritativen Snapshot-/Commit-RPCs blockiert.
4. Mit einem vorhandenen Benutzer aus `public.pvp_admins` einloggen. Unter **Einstellungen → Wartungsmodus** Nachricht festlegen und aktivieren. In einem anonymen Browser prüfen: Wartungsseite statt Spiel; alter Browser bekommt `MAINTENANCE_ACTIVE`.
5. Nach Arbeiten als Admin wieder **Wartung beenden**. Besucher werden nach spätestens ca. 12 Sekunden wieder freigegeben (Netzverbindung vorausgesetzt).

## Sicherheitsprinzip

- Neu ladende Besucher sehen zuerst den Verbindungsbildschirm und dürfen das Spiel erst nach einer bestätigten Freigabe sehen.
- Bereits geöffnete Seiten prüfen den Status alle 12 Sekunden. Nicht-Admins sehen dann ausschließlich die Wartungsseite.
- Die Adminrechte sind **serverseitig** an `public.pvp_admins` gebunden. Ein sichtbarer Admin-Login erlaubt keine Umgehung ohne Adminrolle.
- Der Wartungsschalter ist eine **eigene Tabelle**, damit Statusabfragen nicht an `pvp_control` hängen.
- Die Snapshot-RPC blockiert normale Spielaufrufe früh, der SQL-Commit schützt atomar vor konkurrierendem Einschalten der Wartung.
- Bestehende Speicherstände, laufende Flüge, Berichte und Produktionszeiten werden nicht gelöscht.
- **Kein Zeitstopp:** Während der Wartung verstreicht normale Spielzeit; sie wird nach Freigabe nachberechnet. Echte Spielzeit-Freeze wäre eine weitere Migration.
- Achtung: Weitere, getrennte Community-RPCs gehören nicht zur PvP-Transaktion und bleiben für technisch versierte ältere Clients prinzipiell ansprechbar. Für vollständigen Read-only-Betrieb aller APIs sind gesonderte Guards nötig.
- Notfall-Deaktivierung im SQL Editor: `update public.imperium_maintenance set enabled=false where id=true;`.

SQL zuerst installieren, **dann** die Weboberfläche veröffentlichen, damit der Client nicht wegen eines fehlenden Status-RPCs gesperrt bleibt.
