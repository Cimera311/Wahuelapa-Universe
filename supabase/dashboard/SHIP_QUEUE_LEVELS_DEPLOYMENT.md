# Werftplätze nach Ausbaustufe · 2026-10-11.05

1. Die vollständige `supabase/releases/game-command/2026-10-11.05/game-command.txt` auf der bestehenden Edge Function **swift-handler** deployen. Name und Auth-Einstellungen beibehalten.
2. Website-PR mergen und Spiel neu laden. Keine neue SQL-Migration erforderlich.

## Auftragsplätze

Ein Auftragsplatz pro Werftstufe, maximal 20. Der laufende Auftrag zählt mit: Werft 1 erlaubt einen aktiven Auftrag, Werft 2 einen aktiven und einen wartenden. Ab Stufe 20 steigt die Kapazität nicht weiter. Werft 0 kann keine Schiffe bauen.

Neue Plätze sind unmittelbar nach Abschluss eines Werftausbaus verfügbar. Die Anzeige zeigt belegte und verfügbare Plätze, zum Beispiel `3 / 5 Aufträge`. Bei einer vollen Warteschlange nennt der Hinweis die nächste nötige Werftstufe; ab 20 erscheint die maximale Kapazität.

Bereits bezahlte Aufträge aus `2026-10-11.04` bleiben vollständig erhalten. Spielstände mit bis zu 50 Aufträgen je Planet bleiben lesbar. Eine über der neuen Kapazität liegende Warteschlange wird normal abgearbeitet oder einzeln erstattet; neue Aufträge sind erst möglich, wenn wieder ein Platz frei ist. Die gespeicherten Zahlungen werden nicht verändert.

Die Serverfunktion prüft die Grenze selbst, auch für ältere Clients. Zahlung, Erstattung, Orbitalplätze und Baugeschwindigkeit bleiben wie in `2026-10-11.04`.

## Rollback

Ein Rückwechsel auf `2026-10-11.04` bleibt mit diesen Aufträgen kompatibel und erlaubt wieder bis zu 50 neue Aufträge. Für einen Rückwechsel auf ältere Versionen ohne Warteschlange gelten weiterhin die Bedingungen in [SHIP_QUEUE_DEPLOYMENT.md](SHIP_QUEUE_DEPLOYMENT.md): wartende Aufträge vorher vollständig abarbeiten oder erstatten.
