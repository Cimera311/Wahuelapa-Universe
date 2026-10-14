# Aktivierung

1. PR mergen.
2. `supabase/fix-ranking-partner-fleets.sql` vollständig im SQL Editor des Projekts Wahuelapa ausführen: https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/sql/new
3. Im Spiel die Rangliste erneut öffnen bzw. aktualisieren.

Keine neue Game-command und kein Deploy von `swift-handler` nötig. Die SQL ersetzt ausschließlich die Ranglistenfunktion; Spielstände und Flotten werden nicht geändert. Sie setzt das bestehende Partnersystem voraus und kann erneut ausgeführt werden. Nicht die alten Ranglisten-SQL-Dateien erneut ausführen: Der Partner-Fix muss zuletzt installiert sein.

# News-Entwurf – erst nach Aktivierung veröffentlichen

## 🛡️ Verteidigen bringt eure Punkte zurück!

Wer seine Flotte zur Unterstützung zu einem Partner schickt, soll dafür keine Ranglistenpunkte verlieren. Genau das ist durch einen Fehler in der Berechnung passiert: Die Schiffe waren noch da, ihre Punkte fehlten aber in der Rangliste. 🔍

Mit dieser Korrektur zählen Partnerflotten auf dem Hinflug, während der Verteidigung und auf dem Rückweg wieder bei ihrem Eigentümer. Das gilt auch für Frachter auf Partnerlieferungen und Tauschflügen. Nach einem Kampf zählen die überlebenden Schiffe; bei der Heimkehr wird nichts doppelt gewertet. 🚀

Öffnet nach dem Update eure Rangliste erneut. Eure Verstärkung hält dann nicht nur dem Partner den Rücken frei, sondern behält auch ihren Platz in eurer Wertung. 😁
