# Kampfengine v7 – Zielbindung bis zur Zerstörung

Status: Implementierung zur Prüfung. Noch nicht im Livebetrieb aktiviert.

## Spielregeln

- Neue Ziele werden zufällig und nach Zahl der lebenden Einheiten ausgewählt. Kriegsschiffe und Orbitalgeschütze bilden einen gemeinsamen Zielpool; zivile Schiffe werden erst angegriffen, wenn keine lebenden Kampfeinheiten mehr verfügbar sind. Rapid-Fire-Paarungen und frühere Schadensboni beeinflussen diese Auswahl nicht.
- Jedes Schiff behält sein Ziel über normale Schüsse und Runden hinweg, bis dessen Hülle durch die vorgemerkten Treffer erschöpft ist. Beim nächsten normalen Schuss wird ein lebendes Ziel gewählt. Die regulären Schüsse eines Titans verursachen weiterhin je ein Viertel seines Angriffswerts.
- Jeder normale Schuss kann Rapid Fire auslösen. Die Wahrscheinlichkeit kommt unverändert aus der beim Start gespeicherten Test4-Matrix. Eine Zusatzsalve verursacht wie in v6 den vollständigen Angriffswert, geht aber immer auf dasselbe Ziel. Nach jeder Zusatzsalve wird erneut gewürfelt. Auch ein bereits tödlich getroffenes Ziel bleibt für diese Proc-Kette gebunden; Überschaden verfällt.
- Insgesamt maximal drei zusätzliche vollständige Salven pro Schiff und Kampfrunde, gemeinsam über alle normalen Schüsse. Das Limit wird nicht bei einem Zielwechsel zurückgesetzt.
- Gegenfeuer bleibt gleichzeitig: Jede zu Rundenbeginn lebende Einheit feuert. Die für das Weiterzielen vorgemerkten Abschüsse entfernen nicht deren Gegenfeuer. Endgültige Hülle, Schilde und Verluste werden nach beiden Feuerphasen verrechnet.
- Runde 0 bleibt der exklusive Erstschlag der Orbitalverteidigung. Rapid Fire wird dort entsprechend der gespeicherten Konfiguration erlaubt oder unterdrückt.
- Hülle, Schild, Grundangriff, Baupreise, Forschung, Reparaturregeln und Rundenlimit werden nicht angepasst. Schilde regenerieren wie bisher nicht zwischen Runden.

**Bewusste Änderung gegenüber v6:** Rapid Fire wird nach einzelnen normalen Schüssen statt erst nach der gesamten regulären Salve geprüft. Zusatzsalven bleiben vollständig; das gemeinsame Limit bleibt drei. Dies verändert die Verteilung und den Erwartungswert der Feuerkraft mehrschüssiger Einheiten. v7 ist eine neue Kampfversion, kein ergebnisneutraler Fehlerpatch. Die folgenden Einzelkämpfe belegen keine allgemeine Balance.

## Referenz Aster-2

19.10.2026, 13:23 Uhr Europe/Berlin: Cimera gegen Der Verwalter. Beide Seiten mit Waffen/Schild/Panzerung 5 und voller Anfangshülle. Gespeicherter Seed und Test4-Matrix. Das Skript reproduziert zuerst exakt die in der Datenbank gespeicherten v6-Rundenergebnisse und vergleicht anschließend v7.

Ausführen: `node scripts/combat-v7-reference.mjs`

| Kennzahl | v6 | v7 |
|---|---:|---:|
| Ergebnis | Angreifer gewinnt | Angreifer gewinnt |
| Reguläre Runden | 4 | 1 |
| Verlorene Falken | 0 | 646 |
| Verlorene Donner | 23 | 16 |
| Verlorene Titanen | 0 | 0 |
| Ausgeschaltete Verteidiger | 309 | 309 |
| Überschaden gegen Verteidiger, alle Phasen | 8.754.382 | 65.814 |

Die veränderten Regeln verbrauchen Zufallszahlen in anderer Reihenfolge. Gleicher Seed bedeutet daher keine identische Trefferfolge. Die Referenz ist keine Prognose für einen neuen Livekampf.

## Technische Übergabe und Aktivierung

1. PR nach grünen Checks mergen.
2. **Nur** `supabase/combat-v7.sql` im bestehenden Supabase-Projekt ausführen. Die atomare, wiederholbar ausführbare Migration erweitert Adminauswahl, Audit-Constraint und Log-Trigger auf v7. Die aktuell gewählte Engine bleibt bestehen. Keine alten Kampf-SQLs erneut ausführen.
3. Vollständige **Game Command 2026-10-19.01** aus `supabase/releases/game-command/2026-10-19.01/game-command.txt` in der bestehenden Edge Function **swift-handler** als vollständige `index.ts` einsetzen und deployen. Funktionsname und Auth-Einstellungen beibehalten. Das Bundle enthält die aktuellen Cloud-/Handelsrouten-Fixes.
4. Spiel aktualisieren. Unter Einstellungen → Kampfengine für neue Angriffe **v7 · Zieltreues Rapid Fire** wählen.
5. v5 und v6 bleiben im gleichen Menü als Rückfalloptionen verfügbar. Ein Wechsel wirkt nur auf neu gestartete PvP- und Piratenangriffe. Laufende Missionen behalten Kampfversion und gespeicherte Rapid-Fire-Matrix; alte Berichte werden nicht neu berechnet.

Erforderlich sind sowohl SQL als auch Game Command. Nur das Frontend zu mergen reicht nicht. Bis SQL und Game Command bereit sind, v7 nicht aktivieren.

## Prüfung

- `npm test`: 481 Tests bestanden, einschließlich dreizehn neuer v7-Kampf-/Integrationstests.
- `npm run build`: erfolgreich.
- Reale PostgreSQL-Funktionen mit PGlite geprüft: Migration wiederholbar, Engine-Auswahl bleibt erhalten, Admin-/Service-Role-Grenzen, v7-Logs mit Rundenseiten, unveränderliche Historie, Rückwechsel auf v6/v5.
- PvP und PvE: beim Start gespeicherte v7-Version bleibt nach einem Adminwechsel erhalten.
- Zusatzprüfung: 300 vollständige Ergebnisse mit v4/v5/v6 und 100 Seeds je Version stimmen exakt mit dem Quellstand vor diesem Patch überein, einschließlich Unterstützungsflotten.
- Aster-2-v6-Ergebnis exakt reproduziert; Vergleichsskript für v7 beigefügt.

## Fertiger News-Entwurf – erst nach Aktivierung veröffentlichen

### ⚔️ Kampfengine v7: Ziel halten, nach dem Abschuss wechseln!

🎯 Eure Schiffe bleiben jetzt auf ihrem Ziel, bis es zerstört ist. Erst der nächste normale Schuss sucht einen neuen Gegner – auch innerhalb derselben Runde.

⚡ Rapid-Fire-Zusatzsalven treffen weiterhin dasselbe Ziel. Überschüssiger Schaden verfällt. Pro Einheit und Kampfrunde sind maximal drei Zusatzsalven möglich.

🛡️ Eine einzelne Flak kann nicht länger die ganze Titanflotte ablenken: Rapid-Fire-Ziele werden bei der zufälligen Zielauswahl nicht mehr bevorzugt.

🔥 Jeder normale Schuss kann Rapid Fire auslösen. Der orbitale Erstschlag bleibt erhalten; ab Runde 1 feuern beide Seiten gleichzeitig. Grundwerte und Baukosten bleiben gleich.

⏳ Bereits gestartete Angriffe behalten ihre bisherigen Kampfregeln. Wir beobachten die neuen Ergebnisse und freuen uns auf eure Kampfberichte und euer Feedback. Viel Erfolg, Commander! 🫡
