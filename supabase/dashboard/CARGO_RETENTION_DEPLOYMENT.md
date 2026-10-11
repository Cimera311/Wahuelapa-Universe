# Restladung im Frachter – Deployment

## Reihenfolge

1. Die vollständige Datei `supabase/releases/game-command/2026-10-11.02/game-command.txt` in der vorhandenen Supabase Edge Function **swift-handler** einsetzen und deployen. Name und Auth-Einstellungen beibehalten.
2. Den zugehörigen Website-PR mergen und das Spiel neu laden.
3. Eine Lieferung an ein volles Lager prüfen: nur der verfügbare Platz wird entladen, Restladung kehrt zurück. Bei ebenfalls vollem Startlager bleiben Frachter dort gebunden, bis Platz frei wird.

**Keine neue SQL-Migration nötig.** Vorausgesetzt ist der bestehende Stand einschließlich Partnerschaften und `fleet-planning.sql` aus dem Flotten-Update. Die vorhandenen JSON-Snapshots speichern die zusätzlichen Zustände.

## Verhalten

- Lieferungen auf eigene und Partnerplaneten behalten nicht abladbare Rohstoffe an Bord und bringen sie zum Ursprung zurück.
- Handelsrouten behalten Restladung bis zum nächsten Stopp. Diese Ladung belegt Kapazität; Beladen darf sie nicht überschreiten.
- Bei Beendigung einer Route, Stationierung, Abholung und Rückkehr einer Angriffsflotte wird soweit möglich entladen. Bei Restladung bleiben Schiffe gebunden. Heimkehrende Angriffsflotten belegen weiterhin ihren Angriffsplatz.
- Wartende und pausierte Routen laden automatisch ab, wenn Lagerplatz frei wird. Pausierte Routen behalten ihre Schiffe auch nach vollständigem Entladen.
- Direkter Tausch: Bei vollem Partnerlager wartet die Lieferflotte dort, bis ihre Hinladung vollständig abgegeben ist. Die separat reservierte Gegenleistung wird erst danach übernommen; der normale Rückflug beginnt zu diesem Zeitpunkt.
- Am eigenen Planeten wartende Frachter, pausierte Routen und heimgekehrte Angriffsflotten nehmen an dessen Verteidigung teil. Verluste reduzieren auch die tragbare Restladung.
- Bestehende Depotbestände und Erstattungen bleiben erhalten. Neue Flottenlieferungen füllen ausschließlich das echte Lager.
- Schon unterwegs befindliche Flüge behalten ihre Zeiten; beim nächsten Abladen gilt die neue Lagerregel.

## Rollback

Die neue Version ist als `2026-10-11.02` mit TS, TXT und Prüfsumme archiviert. Der vorherige Stand ist `2026-10-11.01`.

**Ein unmittelbarer Rollback auf den alten Backendcode ist bei wartenden Flotten oder beladenen pausierten Routen nicht kompatibel.** Der ältere Save-Validator kennt diese Zustände nicht bzw. verlangt leere pausierte Routen. Solche Flotten müssen zuerst unter dem neuen Stand vollständig entladen und die betreffenden Routen fortgesetzt oder beendet werden. Danach können Backend und Website gemeinsam zurückgesetzt werden. Bei einem Fehler mit noch wartenden Flotten einen kompatiblen Fix auf diesem Stand verwenden. Ein Code-Rollback stellt keine früheren Spielstände wieder her.
