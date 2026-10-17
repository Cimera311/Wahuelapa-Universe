# Melis Piratenbande – Stufenbilder und schlankeres Angriffsformular

Die fünf bereits vorhandenen Funny-Motive aus dem früheren Bilder-Branch werden in den aktuellen Hauptstand übernommen. Sie liegen unter `assets/Meli-piratenbande-funny-v1/` und sind eindeutig den Stationen zugeordnet:

| Station | Dateiname |
| --- | --- |
| Schmugglernest | smugglers.webp |
| Piratenposten | outpost.webp |
| Raubritterhafen | harbor.webp |
| Freibeuterfestung | fortress.webp |
| Piratenhauptquartier | headquarters.webp |

Die Stationsliste verwendet pro Stufe die zugehörige kleine `-thumb.webp`-Vorschau. Auch die Ziele der animierten Flugbahnen verwenden das passende Motiv. Rechts wird das vollständige 3:2-Bild ohne Beschnitt angezeigt. Platzhaltergrafik und Platzhalterbeschriftung entfallen. Die zehn WebP-Dateien benötigen zusammen etwa 1,5 MB; alle fünf Vorschauen zusammen etwa 124 KB. Es werden keine externen Bildanfragen an Drive benötigt.

Die zusätzliche Checkbox zur Bestätigung möglicher Schiffsverluste entfällt vollständig, einschließlich der Formularprüfung. Der gelbe Admin-/Bilder-folgen-Hinweisbanner entfällt ebenfalls. Der bestehende Adminzugang, die Missionsregeln und die animierten Flüge bleiben erhalten.

Geprüft: 409 Tests und Build erfolgreich. Echte Browserprüfung aller fünf Stufen sowie bei 1365, 390 und 320 Pixeln: richtige Motive, vollständige Bilddarstellung, keine fehlenden Bilder oder horizontalen Überläufe. Das Angriffsformular funktioniert ohne Checkbox.

## Aktivierung

PR mergen, Pages-Deployment abwarten, Spiel aktualisieren. **Keine SQL und keine neue Game-command erforderlich.**

## News-Entwurf – noch nicht veröffentlichen

🏴‍☠️ **Melis Piratenbande ist da!**

Jede Piratenstufe bekommt ihr eigenes Funny-Motiv – als kleine Vorschau in der Stationsliste und groß in der Detailansicht. Die animierten Flüge bleiben direkt bei ihren Zielen sichtbar.

Das Angriffsformular ist schlanker: Die zusätzliche Bestätigungscheckbox und der bisherige Hinweisbanner entfallen. Der Bereich bleibt vorerst im Admin-Test.
