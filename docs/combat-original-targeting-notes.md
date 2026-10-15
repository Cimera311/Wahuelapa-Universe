# Ursprungsidee: Zielverteilung und Spezialschüsse (Diskussionsstand)

Diese Notiz dokumentiert die **früher im Chat beschriebene Idee**, nicht die derzeit implementierten v6-Rapid-Fire-Regeln. Eine ältere Markdown-Datei mit exakt diesen Regeln konnte im Repository nicht bestätigt werden.

## Frühere Beschreibung
- **Falke gegen Titan:** Im Gespräch fiel die Idee, Falken gegen einen Titanen **viermal feuern** zu lassen. Dies entspricht einer festgelegten Anzahl von Schüssen gegen diesen Zieltyp, nicht automatisch vier unabhängigen Rapid-Fire-Chancen.
- **Titan gegen Falken:** Seine **vier regulären Schüsse** sollen möglichst **vier verschiedene, fest gewählte Falken** treffen.
- **Titan gegen Titan:** Alle **vier regulären Schüsse** gehen auf **denselben Titanen**.
- **Wächter gegen Falken:** Jeder reguläre Schuss erhält ein eigenes Ziel; gegen andere Schiffstypen sollen die zwei Schüsse auf **ein gelocktes Ziel** gehen.
- **Donner:** Priorität auf Orbitalgeschütze; besondere Rapid-Fire-Interaktion mit diesen Zielen wurde gewünscht.

## Achtung: Unterschied zum aktuellen v6-Prototyp
Der aktuelle Prototyp verwendet v5-Zielbindung **pro Einheit und Runde** plus zufällige **zusätzliche komplette Salven** mit konfigurierbaren Wahrscheinlichkeiten. Das bildet die obige **zieltypabhängige Verteilung der regulären Schüsse** noch **nicht** ab.

Eine zukünftige Realm-Konfiguration könnte beide Eigenschaften getrennt modellieren:
- `targeting.shotDistribution[attacker][defender]`: `single`, `split`, `distinct` und ggf. Schusszahl pro Paarung.
- `rapidFire.chances[attacker][defender]`: Chance auf weitere komplette Salven.
- `rapidFire.maxExtraSalvos`: Limit für zusätzliche Salven.

**Nicht** ohne weitere Abstimmung diese früheren Ideen als bereits vorhandene oder freigegebene Kampfwerte ausgeben. Besonders die Falken-gegen-Titan-Vierfachschüsse müssen vor Implementierung gegen die bestehenden Schiffswerte geprüft werden.

## Implementierter Benchmark-Test3 (15.10.2026)
- Falke → Titan: 4 Treffer zu je 15 Basis-Schaden (bestehender +25-%-Bonus bleibt), gemeinsames Ziel.
- Titan → Falke: 4 reguläre Treffer, möglichst vier unterschiedliche Falken.
- Titan → Titan: 4 reguläre Treffer, alle auf denselben Titanen.
- Wächter → Falke: 2 reguläre Treffer, möglichst zwei unterschiedliche Falken.
- Wächter → andere: unveränderte v5-Zielbindung.
- Rapid-Fire-Zusatzsalven in Test3 deaktiviert, um die Schussverteilung isoliert zu prüfen.
- Alle anderen Paarungen nutzen die bisherigen v5-Regeln und Schadensboni.
- Die Auswahl der Zielart folgt noch den existierenden Zielprioritäten. Diese Test3-Regeln verändern nicht die live geschaltete v5-Engine.
