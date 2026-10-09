# PvP v1 – WaHueLaPa Universe

## Status und Installation

Der Code implementiert PvP ohne laufenden Cron. Angemeldete Spieler senden Spielaktionen an die Supabase Edge Function `game-command`. Diese berechnet die verbindliche Wirtschaft, lokale Flotten, Galaxiemissionen und Kämpfe anhand der Datenbankzeit. Der Browser zeigt eine Vorschau zwischen den Abgleichen.

**PvP startet ausgeschaltet.** Der Schalter blockiert neue Angriffe. Laufende Angriffe, Gefechte, Produktion und Rückflüge laufen weiter. Auch während einer Pause bleibt der Server für Spielstände zuständig.

Installationsreihenfolge:

1. Bestehende SQL-Erweiterungen installiert lassen: setup.sql, leaderboard.sql, ship-tiers.sql, galaxy.sql, player-systems.sql, mixed-routes.sql, public-colonies.sql.
2. Neue Website-Version bauen und bereitstellen. Solange die PvP-Migration fehlt, funktioniert die bisherige Cloud-Anbindung weiter.
3. Edge Function bereitstellen: Alternativ zur CLI den gesamten Inhalt von `supabase/dashboard/game-command.ts` in **Edge Functions → Deploy a new function → Via Editor** unter dem Namen **game-command** als `index.ts` einfügen, deployen und in den Funktionsdetails **Verify JWT with legacy secret** ausschalten. Die Funktion prüft Benutzer selbst mit `auth.getUser`. Details: `supabase/dashboard/README.md`.

   Oder Supabase CLI anmelden und die Edge Function deployen:
   ```powershell
   npx supabase login
   npx supabase functions deploy game-command --project-ref qavlbxbkhahjbpgcmazd
   ```
   Die relativen Imports aus `src/` werden mit der Funktion gebündelt. `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sind serverseitige Supabase-Umgebungsvariablen. Der geheime Schlüssel gehört niemals in Website-Dateien.
4. `supabase/pvp.sql` **zuletzt** im Supabase SQL Editor ausführen. Diese Migration schließt die bisherigen direkten Spielstand- und Galaxie-Schreibfunktionen für Browser. Deshalb die Edge Function vorher deployen.
5. Dein Spielkonto als Administrator freischalten, beispielsweise:
   ```sql
   insert into public.pvp_admins(user_id)
   select id from auth.users where lower(email) = 'sebtest@test.com'
   on conflict do nothing;
   ```
   E-Mail bei Bedarf durch das gewünschte Admin-Konto ersetzen.
6. Website neu laden, anmelden und unter **Einstellungen → PvP** den Schalter aktivieren. Unter **Flotten → PvP & Verteidigung** befinden sich Angriffe, Warnungen und Kampfberichte.
7. Einen Testangriff zwischen zwei geeigneten gemeinsamen Kolonien prüfen, einschließlich Rückflug und Pause. Die lokalen PostgreSQL-Tests ersetzen diesen Test im echten Projekt nicht.

Neue Cloud-Konten starten mit einer serverseitig erstellten Heimatwelt. Browser-Import und Neustart können einen bestehenden Server-Spielstand nicht überschreiben. Gastspiele bleiben lokal spielbar und exportierbar. Bereits vorhandene Cloud-Spielstände werden als Ausgangsstand übernommen; frühere Browser-Wirtschaft wird dabei nicht rückwirkend auditiert.

Bei erneuter Installation älterer SQL-Dateien **pvp.sql danach erneut ausführen**, damit deren Berechtigungen nicht die Serverautorität umgehen. Die Migration setzt den PvP-Schalter und bekannte Gründungszeiten nicht zurück.

## Schalter und Notfallpause

Nur UUIDs in `pvp_admins` dürfen den globalen Schalter bedienen. Jede Änderung wird in `pvp_switch_log` protokolliert. Auch ein direkt gesendeter fremder Admin-Auftrag wird abgelehnt.

Falls die Website nicht erreichbar ist, im Supabase SQL Editor:

```sql
update public.pvp_control
set enabled = false, epoch = epoch + 1, changed_at = now()
where id = true;
insert into public.pvp_switch_log(user_id, enabled) values (null, false);
```

Zum Einschalten `false` durch `true` ersetzen. Das Erhöhen von `epoch` verhindert, dass eine bereits laufende Anfrage den Schalter mit einem älteren Weltstand überschreibt.

**Eine Pause friert keine bestehenden Flüge ein und macht bereits eingetretene Kämpfe nicht rückgängig.**

## Ablauf und Regeln

- Tutorial-Welten sind dauerhaft geschützt. Angriffe starten ausschließlich an eigenen besiedelten gemeinsamen Kolonien.
- Jede neue gemeinsame Kolonie hat 24 Stunden Schutz ab Ankunft des Kolonieschiffs. Ein eigener Angriff beendet den Schutz der Startkolonie. Beim Start und bei Ankunft wird der Zielschutz geprüft.
- Bereits vorhandene Kolonien behalten ihre bekannte Gründungszeit aus abgeschlossenen Missionen. Fehlt diese, erhalten sie bei der ersten Installation einmal 24 Stunden Schonfrist.
- 1–100 Schiffe je Angriffsflotte, mindestens ein Kriegsschiff. Maximal eine aktive Angriffsflotte je Commander und zwei Starts gegen denselben Commander innerhalb von 24 Stunden.
- Für diese erste Version maximal 5000 Einheiten je Planet einschließlich Bauaufträgen und zugehörigen Rückflotten. Gemeinsame Kolonien mit größeren Altbeständen müssen vor dem Umstieg angepasst werden. Die Reservierungsprüfung verhindert, dass spätere eigene Ankünfte den Grenzwert überschreiten.
- Interstellare Falken benötigen die neue Forschung **Falke-Galaxieantrieb** sowie Staustrahltechnik. Kleine Transporter und Kurier können nur innerhalb desselben Systems angreifen.
- Flugzeit: Entfernung = mindestens 1 AE, Systemabstand / 40 plus 0,15 je Abstand der Planetenplätze. Je Schiff `(600 + Entfernung × 120) / (Tempo × (1 + Antriebsstufe × 0,12))` Sekunden; die langsamste Klasse bestimmt den Flug. Minimum fünf Minuten je Strecke. Treibstoff beider Strecken wird beim Start bezahlt.
- Sensortechnik des Verteidigers bestimmt die Warnung: Stufe 0/1/2/3/4/5 → 90/74/58/42/26/10 % des Hinflugs. Vorher wird der Angriff dem Verteidiger überhaupt nicht ausgeliefert. Warnungen erscheinen beim nächsten Abgleich; geschlossene Browser erhalten keine Push-Nachricht.
- Bei Ankunft wird zuerst Produktion, Forschung, Bau und eigene Flotten bis exakt zu diesem Zeitpunkt verarbeitet. Dann folgt der Kampf. Aktionen nach der Ankunft können diesen Zustand nicht nachträglich verändern.
- Bei gleichzeitigem Ereignis: Forschung/Bau/lokale Flotten vor externen Ereignissen; Erkundung und Kolonieabschluss vor PvP; gleichzeitige Angriffe in stabiler Missions-ID-Reihenfolge.
- Maximal sechs Kampfrunden mit gleichzeitigem Beschuss. Einheiten, die in einer Runde zerstört werden, feuern in dieser Runde noch. Frachter können getroffen werden und machen keinen Schaden.
- Forschung für Waffen, Schilde und Panzerung gibt je Stufe +8 %, maximal fünf Stufen. Der Angreifer nimmt seine Werte beim Start mit, der Verteidiger verwendet seine Werte bei Ankunft.
- Zufallswert für den Kampf entsteht ausschließlich auf dem Server und wird gespeichert. Eine erneute Anfrage würfelt keinen neuen Kampf aus.
- Unentschieden: keine Planetenbeute, überlebende Angreifer kehren zurück. Ist die gesamte Angriffsflotte zerstört, bleibt keine leere Rückflugmission aktiv.
- Rückkehrzeit ist Ankunft plus ursprüngliche Hinflugzeit. Offlinezeit und der Zeitpunkt des späteren Abgleichs verlängern den Einsatz nicht. Beides kann beim ersten Login bereits abgeschlossen sein.
- Es gibt keine Eroberung oder Zerstörung von Gebäuden/Forschung.

## Beute, Trümmer und Reparatur

Bei Sieg des Angreifers maximal 25 % der plünderbaren Vorräte einschließlich Lieferdepot. Normale Handelsreserven schützen nicht vor Raub. Der Bunker schützt je Stufe 2,5 % der Lagerkapazität, maximal 2000 je Rohstoff und maximal vier Stufen.

Zusätzlich begrenzt ein gemeinsames Beutebudget pro Zielkolonie alle erfolgreichen Raids innerhalb von 24 Stunden auf 25 % der beim ersten Raid vorhandenen ungeschützten Bestände. Weitere Angreifer können dieses Budget nicht mehrfach ausschöpfen. Ein neuer Zeitraum beginnt nach Ablauf der 24 Stunden; das ist kein täglicher Mitternachts-Reset.

Nur überlebende Frachter bieten Laderaum. Zuerst werden Metall, Kristall und Treibstoff als Planetenbeute geladen; anschließend Metall/Kristall aus dem Trümmerfeld. Überschüsse bleiben am Ziel.

Zerstörte Schiffe erzeugen 30 % ihrer Metall-/Kristallkosten als Trümmer, keinen Treibstoff. Zerstörte Verteidigung liefert 70 % Metall/Kristall als geschützte lokale Reparaturmaterialien. Dieses Material kann nur neue Verteidigung finanzieren und wird nicht als Beute oder Fracht verfügbar.

Überlebende Einheiten behalten beschädigte Hüllen, auch beim Stationieren und auf Handelsrouten. Reparatur kostet 30 % der ursprünglichen Metall-/Kristallkosten anteilig zum fehlenden Hüllenanteil und erfolgt in v1 sofort. Schilde regenerieren innerhalb von fünf Minuten; Reparatur setzt diese Wartezeit nicht zurück.

## Einheiten

| Einheit | Metall/Kristall/Treibstoff | Bauzeit | Hülle | Schild | Schaden/Runde | Salven | Bonus |
|---|---|---|---:|---:|---:|---:|---|
| Falke T1 | 240/150/60 | 1 Min | 160 | 40 | 30 | 1 | +25 % gegen Donner/Titan |
| Wächter T2 | 900/600/220 | 3 Min | 650 | 180 | 100 | 2 | +50 % gegen Falke |
| Donner T3 | 3000/1800/700 | 8 Min | 2000 | 400 | 350 | 2 | +50 % gegen Verteidigung |
| Titan T4 | 9500/6500/2500 | 20 Min | 6500 | 1400 | 1100 | 4 | +25 % gegen Wächter/Donner |
| Flak | 160/80/20 | 1 Min | 180 | 30 | 35 | 2 | +75 % gegen Falke |
| Laser | 450/300/70 | 3 Min | 600 | 150 | 100 | 2 | Universell |
| Railgun | 1400/1000/280 | 8 Min | 1600 | 300 | 300 | 1 | +25 % gegen Donner/Titan |
| Plasma | 4000/2800/900 | 20 Min | 4500 | 800 | 800 | 2 | +25 % gegen Titan |

Die Orbitalplattform bietet vier Plätze je Stufe, maximal 16. Flak/Laser/Railgun/Plasma verbrauchen 1/2/3/4 Plätze. Gebäude und neue Technologien verwenden modulare SVG-Icons; vorhandene Schiffsbilder bleiben unverändert.

## Architektur und Prüfung

`src/combat.js`: Kampfwerte, Flugvorschau, deterministische Berechnung und Ladung.
`src/server-world.js`: chronologisches Verarbeiten der gemeinsamen Welt und validierte Spielaktionen.
`src/server-service.js`: Wiederholungen bei Konkurrenz, spielergebundene Missions-IDs, identische Auftrags-IDs bei Wiederholung, private Antwortprojektion.
`supabase/pvp.sql`: private Tabellen, serverseitige Zeiten, kurze atomare Transaktionen und Weltrevision.
`supabase/functions/game-command/index.ts`: authentifizierter HTTP-Einstieg.
`src/pvp-ui.js`: Angriffsauswahl, Meldungen, Berichte und Admin-Schalter.

Die Funktion prüft jedes Benutzertoken mit `auth.getUser`. Deshalb ist die vorgelagerte Gateway-JWT-Prüfung deaktiviert; ohne gültiges Benutzerkonto werden Anfragen weiterhin abgelehnt. Benutzeridentität wird niemals aus dem Anfragekörper übernommen.

Die einfache Weltrevision verarbeitet bei einem Abgleich die bestehenden Spieler gemeinsam. Das ist für eine kleine Freundesrunde gedacht. Eine wesentlich größere Spielerschaft sollte nach gemessener Last auf feinere Sperren und gezielte Verarbeitung einzelner Beteiligter umgestellt werden.

Ein späterer gemeinsamer Hintergrundjob kann dieselbe Weltberechnung nutzen. Aktuell werden keine Cron-Jobs eingerichtet. Regelmäßige Abgleiche verwenden Edge-Function-Aufrufe und Datenbankressourcen; deren Nutzung gehört zum jeweiligen Supabase-Kontingent.

Prüfen:
```powershell
npm ci
npm test
npm run build
npx deno check --node-modules-dir=auto --no-lock supabase/functions/game-command/index.ts
```

Tests decken Berechtigungen, Schutzgrenzen, Warnungsgeheimhaltung, gleichzeitig wirkenden Beschuss, beschädigte Rückflotten, Bunker/Depot, Beutebudget, Offline-Nachholen, Bauabschlüsse an der Ankunftsgrenze, Pause sowie doppelte/verlorene Anfragen ab. PostgreSQL wird durch PGlite geprüft, nicht durch eine SQL-Attrappe.

Offizielle Grundlagen: [Edge-Function-Authentifizierung](https://supabase.com/docs/guides/functions/auth-legacy-jwt), [getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [Edge Functions deployen](https://supabase.com/docs/guides/functions/quickstart).
