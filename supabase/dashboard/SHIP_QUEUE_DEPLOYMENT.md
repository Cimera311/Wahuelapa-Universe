# Werft-Warteschlange · 2026-10-11.04

1. Die vollständige `supabase/releases/game-command/2026-10-11.04/game-command.txt` als Code der vorhandenen Edge Function **swift-handler** deployen. Funktionsnamen und Auth-Einstellungen beibehalten.
2. Danach den Website-PR mergen und das Spiel neu laden. Es ist keine neue SQL-Migration notwendig; vorhandene Partnerschafts-/Flotten-Migrationen bleiben Voraussetzung.
3. Auf einem eigenen Planeten einen Auftrag starten, einen zweiten einreihen und einen wartenden Auftrag entfernen. Restlicher aktiver Bau, lokale Zahlung und Erstattung prüfen.

Die Funktion meldet `features.shipQueue: true`. Ein neuer Client verhindert das Einreihen auf einem älteren Server und zeigt einen Updatehinweis. Ein älterer Client kann gegen die neue Funktion seinen vorhandenen Einzelauftrag weiter bedienen.

## Verhalten und gespeicherte Aufträge

- `shipjob` bleibt der laufende Auftrag. `shipqueue` enthält die wartenden Aufträge in ihrer Reihenfolge. Alte Spielstände ohne Warteschlange bleiben gültig.
- Rohstoffe und gegebenenfalls Reparaturmaterial werden beim Einreihen bezahlt. Jeder Auftrag behält seine eigene Zahlung und eine feste ID; Entfernen erstattet nur diesen Auftrag. Überschüsse werden im Lieferdepot gehalten.
- Bis zu 50 Aufträge einschließlich aktivem Auftrag pro Planet. Verteidigungen reservieren auch wartend ihre Orbitalplätze.
- Bauaufträge bleiben wie bisher Chargen: Ihre Schiffe werden gemeinsam bei Abschluss verfügbar. Die Bauzeit bei voller Energie wird beim Bezahlen festgelegt; die tatsächliche Geschwindigkeit folgt der Energieversorgung. Wartende Aufträge erhalten keinen vorzeitigen Fortschritt.
- Nach Abschluss oder Abbruch des aktiven Auftrags startet der nächste zur jeweiligen Ereigniszeit. Offline-Nachberechnung läuft über dieselben Ereignisse.
- Angezeigte Start- und Gesamtzeiten gelten bei aktueller Energieversorgung. Bei fehlender Energie stehen die Aufträge still; zukünftige Ausbauten und Forschungen können die Zeiten verändern.

## Rollback

Vor einem Rückwechsel auf `2026-10-11.03` müssen alle wartenden Aufträge fertig gebaut oder mit dieser Version entfernt werden. Älterer Code kennt `shipqueue` nicht und startet daraus keine Folgeaufträge. Das bereits bezahlte Material darf nicht durch Löschen des Felds verloren gehen. Danach Website und Edge Function gemeinsam zurücksetzen. Das Archiv setzt gespeicherte Spielstände nicht zurück.
