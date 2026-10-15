# Orbitalwerft – neue Ausbaukosten

## Aktivierung

Die einmalige Stufenumrechnung und Restwert-Erstattung wurde am 15.10.2026 bereits live durchgeführt. Diese NICHT erneut vorbereiten oder auszahlen.

1. Diesen PR nach erfolgreichen Checks mergen.
2. Game-command **2026-10-15.01** deployen: In der bestehenden Supabase-Funktion **swift-handler** den gesamten Inhalt der `index.ts` durch den vollständigen Inhalt dieser TXT-Datei ersetzen und deployen:
   https://raw.githubusercontent.com/Cimera311/Wahuelapa-Universe/main/supabase/releases/game-command/2026-10-15.01/game-command.txt
   Funktionsname, bestehende Auth-Einstellungen und Secrets beibehalten. Diese Datei enthält den gesamten Servercode einschließlich aller bisherigen Funktionen.
3. `supabase/orbitalwerft-costs.sql` vollständig im SQL Editor ausführen:
   https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/sql/new
   SQL-Datei: https://github.com/Cimera311/Wahuelapa-Universe/blob/main/supabase/orbitalwerft-costs.sql
   Sie aktualisiert ausschließlich die Ranglisten-Punktefunktion. Die bestehende Leaderboard-Funktion einschließlich Partner-/Angriffsflotten bleibt erhalten. Keine Erstattung, keine Spielstandänderung.
4. Website-Deployment abwarten und Spiel vollständig neu laden. Website und swift-handler müssen beide den neuen Stand nutzen; erst dann wieder Orbitalwerften ausbauen.

## Verhalten

- Grundkosten der Orbitalwerft: 200 Metall, 100 Kristall, 0 Treibstoff.
- Jede Ausbaustufe wächst wie bei der Schiffswerft mit Faktor 1,6. Jeder Rohstoff wird pro Stufe aufgerundet.
- Die alte Sonderkurve mit Faktor 1,08 ab Stufe 5 entfällt.
- Bauzeit des Werftgebäudes, Produktionsbonus, Energiebedarf, Voraussetzungen und Auftragsplätze werden in diesem Update nicht geändert.
- Geschützpreise, Kampfwerte, Geschützproduktion und Reparaturregeln bleiben unverändert.
- Bereits bezahlte Bauaufträge werden nicht neu berechnet. Ihr gespeicherter Materialeinsatz bleibt Grundlage für einen späteren Rückbau.
- Die bereits umgerechneten Werften besitzen eine angepasste Bauhistorie, damit bereits erstattetes Material beim Rückbau nicht erneut berücksichtigt wird.

## News-Entwurf – noch nicht veröffentlichen

### 🏗️ Orbitalwerft: einheitliche Ausbaukosten

Die Orbitalwerft bekommt dieselben Ausbaukosten wie die Schiffswerft: Los geht es mit **200 Metall und 100 Kristall – ohne Treibstoffkosten**. Jede weitere Stufe wird um den Faktor 1,6 teurer.

Bestehende Orbitalwerften wurden anhand ihres bisherigen Materialeinsatzes auf passende Stufen umgerechnet. Je nach bisheriger Stufe kann die neue Stufe höher oder niedriger ausfallen. Überschüssiges Metall, Kristall und der bisherige Treibstoffeinsatz wurden dem jeweiligen Planeten gutgeschrieben. 💎

Ihr findet Erstattungen bei Bedarf unter „Altbestände & Erstattungen“. Sie gehen bei freiem Lagerplatz ins normale Lager über.

Eure Geschütze und bezahlten Geschützbauaufträge bleiben erhalten. Die geplanten reparierbaren Orbitalgeschütze folgen später in einem eigenen Update. 🛠️
