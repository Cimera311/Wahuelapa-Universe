# Gebäudestufen rückbauen — 2026-10-14.04

Ein Vorschlag aus der Wünschebox ist umgesetzt: **Bauen → Gebäude auswählen → „↘ Stufe N rückbauen“**.

## Spielregeln
- Rückbau ist **eine Stufe pro Auftrag** und belegt denselben planetaren Bauplatz wie ein Ausbau.
- Vor dem Start zeigt ein **Bestätigungsmodal** den Planeten, das Gebäude, Stufe vorher/nachher, eine Vorschau der Erstattung, die Dauer und gegebenenfalls ein Energiedefizit. **Abbrechen** verändert nichts.
- **Erstattung** = 20 % der ursprünglichen Metall-, Kristall- und Treibstoffkosten **der entfernten Stufe**, pro Ressource abgerundet. Auszahlung **erst bei Abschluss**, nicht beim Start; volle Lager laufen ins Lieferdepot über.
- **Dauer** = 25 % der für diese Stufe ursprünglich gespeicherten Bauzeit, in Millisekunden aufgerundet. Neu gebaute Stufen schreiben ihre tatsächlich bezahlten Kosten und ihre bestellte Bauzeit in den JSON-Spielstand. Für Altstufen ohne Historie gilt die aktuelle Kosten- und Zeitformel als Näherung.
- Strommangel ist erlaubt, aber wird vor Bestätigung deutlich angezeigt. Die niedrigere Stromerzeugung / Energieeffizienz wirkt exakt ab Fertigstellung, auch nach Offline-Zeiten.
- Für belegte Bauplätze und Abhängigkeiten (letztes Labor mit Schiffswerft, laufende Forschung, benötigte Werftstufen, belegtes Reparaturdock) gibt es serverseitige Sperren. Die laufenden Forschungen und Schiffbau-Warteschlangen bleiben bestehen.
- Nach Abschluss werden die geschätzten historischen Daten der entfernten Stufe entfernt. Ein späterer erneuter Ausbau erfasst die neue tatsächliche Zahlung.

## Aktivierung
**Kein SQL erforderlich:** Die neuen Informationen befinden sich im vorhandenen `game_saves.state`-JSON.

**Wichtig:** Server-Version vor dem Merge aktualisieren, damit Browser und Edge Function dieselbe neue Aktion verstehen.

1. In `supabase/releases/game-command/2026-10-14.04/game-command.txt` die **vollständige** Game Command nehmen (gleich `supabase/dashboard/game-command-gesamt.txt`).
2. In Supabase die **vorhandene** Edge Function `swift-handler` öffnen. `index.ts` vollständig ersetzen und deployen. Funktion und Auth-Einstellungen beibehalten (`verify_jwt=false`, Auth wird im Code geprüft).
3. PR #69 mergen und GitHub Pages fertig deployen lassen.
4. Seite aktualisieren. Im Bauen-Menü eine vorhandene Gebäudestufe auswählen; Bestätigungsdialog überprüfen.

Solange das Backend noch nicht `features.buildingDemolition` meldet, bleibt der Rückbau-Button gesperrt. Andere Bau- und Forschungsvorgänge bleiben verfügbar.

## Teststrategie
`npm test` deckt Originalkosten-/Zeitberechnung, spätere Forschungsboni, Rückbau-Abrechnung, Überschussdepot, Lade-/Speicherkompatibilität, Sperren, modale Bestätigung und serverseitige Pfade ab. Die gebündelte Game Command wird gesondert mit der Original-Serverlogik verglichen.

## News (erst nach Deployment veröffentlichen)
**🏗️ Gebäude rückbauen!** 🔻
Ab sofort kannst du Gebäudestufen einzeln zurückbauen: mit Bestätigung, **20 % Material zurück** und **25 % der Bauzeit**. ⚡ Die Auswirkungen auf deine Energie siehst du vorher. Fehler oder Auffälligkeiten bitte über die **Wünschebox oder im Chat** melden! ❤️
