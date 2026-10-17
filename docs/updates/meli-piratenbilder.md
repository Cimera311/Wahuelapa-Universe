# Melis Piratenbande – Stationsbilder

Die fünf Stationen zeigen eigene lustige Piratenszenen mit der blonden Kapitänin Meli. Die Stationsliste lädt kleine Vorschaubilder, die Detailansicht das vollständige Motiv. Die Bilder liegen als optimierte WebP-Dateien im Spiel und benötigen keinen Google-Drive-Zugriff.

Dieses Update baut auf PR #89 (Admin-PvE) auf und ergänzt sowohl dessen aktive Stationsansicht als auch die Vorschau. Der Transportkonvoi ist kein Stationstyp und bleibt als separates Asset erhalten.

Geprüft: alle 405 Tests erfolgreich, statischer Build erfolgreich. Browserprüfung in Edge bei 1440, 390 und 320 Pixeln: alle Bilder geladen, kein horizontaler Überlauf; mobile Darstellung visuell geprüft. Die zehn WebP-Dateien benötigen zusammen etwa 1,5 MB; die Stationsliste verwendet nur die kleinen Vorschaubilder.

## Aktivierung

Zuerst PR #89 gemäß dessen eigener Anleitung aktivieren und mergen, danach den Bilder-PR mergen und das Pages-Deployment abwarten. Anschließend das Spiel neu laden. Für den Bilder-PR selbst sind keine SQL und keine neue Game-command erforderlich. Die vorhandene Admin-Freigabe bleibt bestehen.

## News-Entwurf – noch nicht veröffentlicht

🏴‍☠️ **Melis Piratenbande hat ein Gesicht!**

Unsere Piratenstationen bekommen eine humorvolle Bilderreihe mit der blonden Kapitänin Meli: vom kleinen Schmugglernest über Piratenposten und Raubritterhafen bis zur Freibeuterfestung und zum Piratenhauptquartier. Freut euch auf freche Papageien, eine Konfettikanone und jede Menge Beute! 🎉

Die Motive erscheinen in der Stationsauswahl und in der großen Detailansicht unter **Galaxie → Piraten**. Der Bereich bleibt zunächst im Admin-Test. Alles Gute zum Geburtstag, Meli! 🎂
