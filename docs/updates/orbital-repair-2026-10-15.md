# Orbitalgeschütze reparieren – Update 2026-10-15

## Aktivierung

1. PR mergen und Website-Deployment abwarten.
2. `supabase/orbital-repair.sql` vollständig im Supabase SQL Editor ausführen: https://supabase.com/dashboard/project/qavlbxbkhahjbpgcmazd/sql/new
3. Game-command **2026-10-15.02** deployen: `supabase/releases/game-command/2026-10-15.02/game-command.txt`. In der bestehenden Funktion **swift-handler** die `index.ts` vollständig ersetzen und deployen; Auth-Einstellungen beibehalten.
4. Spiel neu laden.

Die SQL ändert ausschließlich die Ranglistenbewertung: Ausgefallene Geschütze und laufende Wiederherstellungen zählen bis zur Fertigstellung keine Punkte. Vorhandene Dockreparaturen, aktive Einheiten und Partnerflotten behalten ihre bisherige Bewertung. Kein erneuter Werft-Squish, kein Refund, keine neue Tabelle.

Die Kampfregel wird mit dem Server-Deploy aktiv. Bereits unterwegs befindliche Angriffe verwenden bei ihrer Ankunft ebenfalls die neue Verlustbehandlung. Vorher abgeschlossene Kämpfe werden nicht rückwirkend verändert. Vorhandene alte `defenseSalvage`-Bestände bleiben unberührt; daraus werden keine Geschütze erfunden oder Rohstoffe ausgezahlt.

## Regeln

- Aktive Flak-, Laser-, Railgun- und Plasmageschütze werden bei vollständigem Hüllenverlust aus dem kampffähigen Bestand entfernt und pro Planet/Typ als `disabledDefenses` gespeichert.
- 30 % ihrer Metall-/Kristall-Baukosten entstehen als normales Trümmerfeld. Treibstoff erzeugt keine Trümmer. Angreifer können bei einem Sieg im Rahmen ihres freien Laderaums bergen; der Rest kann normal abgeholt werden.
- Ausgefallene Geschütze bleiben unabhängig von der Trümmerbergung wiederherstellbar. Sie kämpfen nicht, werden nicht erneut beschossen und erzeugen keine weiteren Trümmer.
- Wiederherstellung im lokalen Reparaturdock kostet 70 % Metall/Kristall, keinen Treibstoff. Kosten werden je Auftrag auf ganze Rohstoffe aufgerundet.
- Basisdauer wie Neubau. Orbitalwerft und Arbeitsroboter verkürzen Neubau und vollständige Wiederherstellung jeweils um 8 % pro Bonusstufe. Die Faktoren werden bei Auftragserteilung festgeschrieben. Energie beeinflusst die tatsächliche Dauer.
- Reparaturen laufen im bestehenden Dock nacheinander; jede fertige Einheit wird sofort wieder aktiv und kann dann erneut kämpfen. Während der vollständigen Wiederherstellung bleibt ein Geschütz geschützt und inaktiv.
- Bei Abbruch: nur unverbrauchtes Material zurück, verbleibende Geschütze zurück in den defekten Bestand. Angebrochene Arbeit und verbrauchtes Material gehen verloren; keine kostenfreie Aktivierung.
- Überlebende teilbeschädigte Einheiten behalten das bestehende System (30 % anteilige Material-/Zeitkosten mit Dockbonus; im Dock angreifbar). Werden solche Geschütze im Dock ausgeschaltet, bleiben auch sie als defekt erhalten. Raumschiffe bleiben bei Zerstörung endgültig verloren.
- Bei gleichzeitig defekten und teilbeschädigten Geschützen desselben Typs werden zuerst die defekten Einheiten in einem eigenen Auftrag reserviert; danach kann ein separater Auftrag für die Teilschäden erteilt werden.
- Bestehende Bau-/Reparaturaufträge bleiben erhalten; neue Arbeitsroboterboni ändern ihre festgeschriebene Dauer nicht.

## News-Entwurf (noch nicht veröffentlicht)

### 🛠️ Orbitalgeschütze: ausgeschaltet heißt reparierbar!

Flak, Laser, Railgun oder Plasma im Kampf verloren? Ab diesem Update bleiben ausgeschaltete Geschütze auf ihrem Planeten als **defekt** erhalten. Sie verteidigen erst wieder, wenn du sie repariert hast. 🛡️

🔧 **So geht’s:** Im Orbit bei den defekten Geschützen auf **„Reparatur planen“** klicken oder das lokale **Reparaturdock** öffnen. Typ und Anzahl auswählen, Kosten prüfen und Auftrag starten. Auch in der Orbitalwerft findest du den Reparaturweg direkt bei beschädigten Geschützen.

💎 Die vollständige Wiederherstellung kostet **70 % der Metall- und Kristall-Baukosten, keinen Treibstoff**. Sie dauert wie ein Neubau. Orbitalwerft und Arbeitsroboter beschleunigen beides; genügend Energie hält das Dock am Arbeiten.

☄️ **30 % Metall und Kristall landen als normale Trümmer im Orbit.** Die können andere mitnehmen – oder du selbst bergen. Deine Geschütze bleiben in beiden Fällen reparierbar. Bei vollständiger Eigenbergung bleiben 40 % Metall-/Kristallverlust.

⏳ Defekte Geschütze bleiben auch während ihrer Wiederherstellung inaktiv. Sie können in dieser Zeit weder kämpfen noch erneut Trümmer erzeugen. Fertige Einheiten sind wieder voll einsatzbereit und zählen wieder in der Rangliste.

Teilschäden werden weiterhin anteilig repariert. Zerstörte Raumschiffe bleiben verloren. Die neue Regel gilt für künftig abgewickelte Kämpfe; frühere Verluste werden nicht rückwirkend wiederhergestellt.
