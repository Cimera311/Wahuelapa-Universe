# Gezeitenkraftwerke: Heimatwelt und Standardtypen freigeschaltet (28.10.2026)

## Änderung
- `powerPlants.default.tidal.enabled`: `false` → `true`.
- `powerPlants.Heimatwelt.tidal.enabled`: `false` → `true`.
- Gezeiten-Effizienz und Exponent bleiben jeweils **1,0** und **1,25**.
- Gesteinsplanet: Gezeiten weiterhin gesperrt; Eisplanet und Ozeanplanet unverändert.
- Treibstoffkraftwerk weiterhin überall gesperrt.
- Frontend und Server-Bundle synchronisiert; Game-Command-Version `2026-10-28.03` archiviert.

## Prüfung der Produktionswirkung (Live-Saves, nur lesend)
- **14 Spielstände / 79 Planeten**.
- **14 Heimatwelten**, davon **10 mit bestehenden Gezeitenkraftwerken**, zusammen **44 Ausbaustufen**.
- **7 Kontinentalplaneten** ohne bestehende Gezeitenkraftwerke.
- Die Berechnung bestehender Energieproduktion ist **unverändert**, da sich nur `enabled` ändert, nicht `efficiency` oder `exponent`. Deshalb **0 unmittelbare Energie- und Rohstoffproduktionsänderungen**.
- Bestehende Gezeitenkraftwerke auf Heimatwelten dürfen nun wieder ausgebaut werden. Neue Anlagen sind nach Freischaltung der Energieforschung Stufe 3 baubar.

## Rollout
Nach erfolgreichen GitHub-Checks und Review: PR mergen, anschließend Game-Command auf Supabase bereitstellen und Funktion überprüfen. Kein SQL-Backfill erforderlich.
