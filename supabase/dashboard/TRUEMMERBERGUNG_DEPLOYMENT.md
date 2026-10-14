# Trümmerbergung · 2026-10-14.01

1. In Supabase die Edge Function `game-command` durch den vollständigen Inhalt von `supabase/dashboard/game-command-gesamt.txt` ersetzen und deployen. Alternativ die modulare Edge Function per Supabase CLI deployen.
2. Danach den Frontend-PR mergen; GitHub Pages baut das Spiel automatisch.
3. Spiel neu laden. Einen anderen eigenen Startplaneten wählen, dann **Flotte → Handel → Aufträge → Trümmer bergen**. Zielkolonie und Frachter auswählen.

Keine neue SQL erforderlich: Trümmerfelder liegen bereits in `galaxy_planets.debris`; Bergungsflüge werden in den vorhandenen Spielständen gespeichert und mit dem bestehenden atomaren Welt-Commit verarbeitet.

Nur eigene besiedelte Galaxiekolonien sind Bergungsziele. Hin- und Rückflug werden am Start bezahlt. Erst bei Ankunft wird bis zur Flottenkapazität Metall, anschließend Kristall geborgen; Resttrümmer bleiben liegen. Die Fracht kommt zum Startplaneten zurück. Volles Lager bindet die Frachter mit Restladung. Eigentum wird bei Ankunft erneut geprüft; ein inzwischen leeres oder nicht mehr eigenes Ziel führt zur leeren Heimkehr.

Das Frontend sperrt den Start, solange der Server `features.debrisSalvage` nicht bestätigt. Bestehende Angriffsbergung nach einem siegreichen Kampf bleibt erhalten.
