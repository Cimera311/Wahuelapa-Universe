# Partnerflotten von privaten Planeten

1. Version `2026-10-11.03/game-command.txt` aus `supabase/releases/game-command` vollständig in der bestehenden Supabase Edge Function **swift-handler** einsetzen und deployen.
2. Den zugehörigen Website-PR mergen; anschließend neu laden.

Keine neue SQL-Migration erforderlich. Das bestehende Flotten-/Partnerschaftenschema speichert Startplanet und gebundene Schiffe bereits.

Eigene Heimatwelt, Tutorialkolonien und besiedelte Galaxiekolonien können als Ursprung für Lieferung, Verteidigung und direkten Tausch dienen. Das Ziel bleibt eine fremde, besiedelte Galaxiekolonie mit der jeweiligen Partnerfreigabe. Galaxieantrieb, Forschung, Schiffsbestand und vorab bezahlter Hin-/Rückflug werden unverändert geprüft. Private Ursprünge verwenden den persönlichen Galaxieeintritt für die Entfernung.

Rückruf, Gastgeber-Rücksendung, entzogene Rechte und reguläre Rückkehr behalten den ursprünglichen Startplaneten. Volle private Heimatlager halten Restladung und Frachter wie die Galaxielager gebunden. Verteidigungsschiffe bleiben Eigentum ihres Commanders.

Vor einem Rollback auf `2026-10-11.02` alle Partnerflotten von privaten Ursprüngen zurückholen und vollständig entladen sowie noch offene direkte Tauschangebote von privaten Ursprüngen zurückziehen. Der alte Code verlangt für deren Herkunft eine Galaxiekolonie und kann solche laufenden Aufträge nicht verarbeiten. Weiterhin die Restladungs-Hinweise in `CARGO_RETENTION_DEPLOYMENT.md` beachten.
