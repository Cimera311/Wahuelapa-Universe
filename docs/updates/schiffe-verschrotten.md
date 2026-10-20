# Schiffe in der Werft verschrotten

Unter **Flotten → Hangar → Werft → Schiffe verschrotten** steht ein eigener Bereich mit Schiffskarten, Slider, Alle/Keine und freier Zahleneingabe bereit. Größere Mengen können zur Vorschau eingegeben werden; ausgeführt wird nur eine verfügbare ganze Menge.

Die Rückgabe beträgt fest **30 % der Bauressourcen** (Metall, Kristall und Treibstoff), je Rohstoff und Auftrag abgerundet. Sie lässt sich durch Clientparameter oder Realm-Faktoren nicht erhöhen. Ein Titan ergibt 2.850 Metall, 1.950 Kristall und 750 Treibstoff.

Nur freie Schiffe des gewählten eigenen Planeten sind verfügbar. Reisende, auf Handelsrouten gebundene und im Reparaturdock liegende Einheiten werden nicht mitgezählt. Beschädigte freie Schiffe werden zuerst verschrottet; die 30-%-Quote bleibt gleich. Plattformen gehören nicht zu diesem Schiffswerft-Menü.

Vor der endgültigen Aktion zeigt eine Bestätigung die Menge, den Planeten und die exakte Rückgabe. Der Bestand wird vor der Bestätigung und erneut auf dem Server geprüft. Schiffe werden sofort entfernt; die Erstattung landet im Lager, Überschüsse bleiben im bestehenden Lieferdepot. Ranglistenpunkte folgen wie bisher dem verbleibenden Schiffsbestand.

Der bestehende atomare Snapshot/Commit-Weg schützt auch diese Aktion vor Doppelgutschriften bei erneut gesendeten Aufträgen. Die Oberfläche ist bei älteren Servern gesperrt und zeigt den nötigen Aktualisierungshinweis.

## Vorschau

- [Handyansicht](../previews/ship-scrap-mobile.png)
- [Desktopansicht](../previews/ship-scrap-desktop.png)
- [Bestätigung am Handy](../previews/ship-scrap-confirm-mobile.png)

## Prüfung

502 Tests bestanden. Die neuen Tests decken alle Schiffstypen, die feste Rückgabe, manipulierte Clientwerte, volle Lager, Hüllenschäden, gebundene Einheiten, eigene Planeten, Bestätigung/Abbruch, Bestands- und Kontowechsel, alte Server, Cloudabgleich und erneute Requests ab. Der unveränderte SQL-Commitweg wurde mit einer echten lokalen Postgres-Testdatenbank auf genau eine Gutschrift geprüft. Das vollständige Dashboard-Bundle wurde ebenfalls gegen die Quellmodule geprüft.

Build und git diff --check erfolgreich. Browseransichten bei 320, 390 und 1365 Pixeln ohne Seitenüberlauf, fehlende Bilder oder JavaScript-Fehler. Karten und Bestätigung visuell geprüft.

## Aktivierung

1. Sebastian prüft und mergt den PR.
2. Die vollständige [Game-command 2026-10-20.01 als TXT](../../supabase/releases/game-command/2026-10-20.01/game-command.txt) öffnen.
3. Im [Supabase-Projekt](https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/functions) die bestehende Funktion **swift-handler** öffnen. **index.ts vollständig ersetzen** und deployen. Funktionsname und bestehende Auth-Einstellungen beibehalten.
4. Erfolgreiche Pages-Veröffentlichung abwarten und das Spiel neu laden. Die Funktion wird im Menü erst mit der neuen Game-command freigegeben.

**Keine SQL erforderlich.** Es werden die bestehenden Spielstände, Lieferdepots und Auftragsbelege verwendet. Kampfengine v7 und andere bestehende Funktionen sind im vollständigen Bundle enthalten.

## News – veröffentlicht am 20.10.2026

♻️🚀 **Alte Schiffe bekommen einen neuen Zweck!**

Unter **Flotten → Hangar → Werft → Schiffe verschrotten** könnt ihr freie Schiffe jetzt endgültig zerlegen. Dafür erhaltet ihr **30 % ihrer Bauressourcen zurück** – Metall, Kristall und Treibstoff, jeweils abgerundet.

Wählt Schiffstyp und Menge mit den neuen Karten, dem Slider oder der direkten Zahleneingabe. Vor dem Verschrotten zeigt euch die Bestätigung genau, welche Schiffe ihr aufgebt und was ihr zurückbekommt. 🛠️

Schiffe unterwegs und im Reparaturdock bleiben geschützt vor dieser Auswahl. Beschädigte freie Schiffe werden zuerst zerlegt. Ist das Lager voll, bleibt die Rückgabe im Lieferdepot erhalten.
