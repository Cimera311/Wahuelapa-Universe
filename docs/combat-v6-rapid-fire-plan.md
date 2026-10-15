# Combat v6 – Rapid Fire (Entwurf, keine Live-Freischaltung)

## Ziel
Rapid Fire gibt ausgewählten Schiffsklassen **eine Chance auf zusätzliche Salven**, nachdem das Schiff seine regulären Schüsse auf ein Ziel abgegeben hat. v5-Zielbindung bleibt bestehen: reguläre Schüsse pro Schiff werden auf ein Ziel konzentriert.

## Regelvorschlag für ersten v5/v6-Benchmark
1. Jede lebende Einheit wählt ihr Ziel genau wie in v5 nach den bestehenden Bonus- und Klassenprioritäten.
2. Sie gibt ihre reguläre Salve ab. Treffer werden – wie bisher – gesammelt und **erst am Rundenende** gleichzeitig verrechnet.
3. Nur für explizit konfigurierte Paarungen (Angreifer-Schiffstyp, Ziel-Schiffstyp) wird danach eine Rapid-Fire-Chance geprüft.
4. Bei Erfolg erhält das Schiff eine zusätzliche **Salve mit seiner regulären Angriffsstärke** gegen ein **neu gewähltes zulässiges Ziel**. Keine zusätzlicher Angriff bei Misserfolg.
5. Ketten müssen strikt begrenzt sein (Vorschlag: **maximal drei Zusatzsalven pro Schiff und Runde**), damit Laufzeit und Schaden begrenzt bleiben.
6. Rapid Fire gilt auch für Verteidiger und kompatible Orbitalanlagen, aber **nicht in der Runde 0**. Die Eröffnungsrunde bleibt ein einmaliger Plattform-Erstschlag.
7. Neue Salven sind für alle zu Rundenbeginn lebenden Einheiten möglich; die Schäden beider Seiten werden weiterhin simultan verrechnet.
8. Protokoll: Extra-Salven getrennt als aggregierte `rapidFireShots`/ `rapidFireDamage` anzeigen. Für alte Berichte muss dies optional bleiben.
9. v6 erhält eine eigene Regelversion und den bestehenden Admin-Umschalter / migrationsgeschützte Logs. Bereits fliegende Missionen bleiben auf v3/v4/v5.

## Vorgeschlagenes **Test-**Balancing (nicht final)
| Schiff | Ziel | Chance auf eine weitere Salve |
|---|---|---:|
| Wächter | Falke | 20 % |
| Donner | Flak | 15 % |
| Donner | Laser | 15 % |
| Titan | Falke | 10 % |

**Wichtig:** Nur für die Simulation gedacht; erst nach vielen Benchmarkläufen balancieren. Für andere Paarungen kein Rapid Fire. Diese Werte werden nicht mit den bestehenden Bonus-Prozentsätzen gleichgesetzt.

## Benchmark
- Vergleich `v5-v6` ergänzt `v4-v5`, `v3-v4`.
- Szenarien: `swarm`, `duel`, `mid`, `orbital`, `large`, `stress`, `all`.
- Zusätzlich sinnvoll: `mixed` mit Falken, Wächtern, Donnern und Titanen beidseitig.
- Metriken: Winrate, Überlebende, Hüllenschaden, Trümmer, ms/Kampf, KB Bericht, **Rapid-Fire-Salven pro Runde**.
- Sicherheits- und Fairnessprüfung: deterministischer Seed, Schadensgrenzen, simultane Abschüsse, Verteidigergruppen, Reparaturen, CPU-Auslastung, kein Speicheraufblähen.

## Release-Gates
1. Neuen experimentellen Resolver **nicht** live routen.
2. Bei Szenarien >=100 Seeds messen und gezielt Stresstest durchlaufen lassen.
3. Auf einen einzigen Schiffstyp gerichtetes Dauerfeuer sowie sehr schwache Gegenflotten prüfen.
4. Erst danach v6 in Server, SQL, Berichte und Game Command integrieren; Admin-Opt-in wie bei v5.
5. Spieler-News **erst nach** erfolgreichem Live-Test.

Keine Entscheidung zur Einführung oder zu endgültigen Prozentwerten wird durch diesen Entwurf vorweggenommen.
