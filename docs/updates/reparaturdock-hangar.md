# Reparaturdock im Hangar-Stil

Jeder reparierbare Schiffstyp und jede Plattform bekommt eine eigene Karte mit Bild, Slider, Maximum, freier Mengeneingabe, Kosten, Dauer und aufklappbaren Details. Mobil stehen die Karten untereinander, am Desktop in zwei Spalten. Die Warteschlange behält ihre Aktionen und erhält passende Karten mit Fortschrittsbalken.

Größere Wunschmengen bleiben stehen. Slider und Maximum berücksichtigen beschädigte Einheiten und vorhandenes Material. Fehlende Einheiten und Rohstoffe werden ausgewiesen; nicht ausführbare Aufträge bleiben gesperrt. Für zusätzliche noch nicht vorhandene teilbeschädigte Einheiten zeigt die Vorschau ausdrücklich eine Schätzung anhand des aktuellen durchschnittlichen Schadens. Vorhandene Schäden werden weiterhin exakt berechnet, die schwersten zuerst. Vollständig defekte Plattformen nutzen weiterhin 70 % Material und volle Neubauzeit. Defekte und teilbeschädigte Plattformen bleiben getrennte Reparaturchargen.

Entwürfe und geöffnete Details bleiben beim Cloudabgleich erhalten, getrennt je Konto, Spielstand, Planet und Einheit. Serverseitige Reparaturregeln bleiben unverändert.

## Prüfung

491 Tests bestanden, darunter zehn neue Prüfungen für Kosten, freie Planung, Slider und Maximum, unabhängige Aufträge, getrennte Plattformchargen, Cloudabgleich, Kontogrenzen, volle Warteschlangen und ältere Server. Build und git diff --check erfolgreich. Handy- und Desktopansichten bei 320, 390 und 1365 Pixeln im Browser geprüft: kein Seitenüberlauf, keine fehlenden Bilder oder JavaScript-Fehler. Änderungen auf dem aktuellen Stand mit Kampfengine v7.

## News-Entwurf – noch nicht veröffentlicht

🛠️✨ Das Reparaturdock bekommt den Hangar-Look!

Unter **Flotten → Hangar → Reparaturdock** findet ihr beschädigte Schiffe und Plattformen jetzt auf eigenen Karten. Wählt die Menge per Slider, tippt sie direkt ein oder nutzt Maximum. Kosten, Reparaturdauer und fehlende Ressourcen passen sich direkt an. 🚀

Auch größere Mengen lassen sich zum Planen eingeben. Bei zusätzlichen teilbeschädigten Einheiten kennzeichnen wir die Vorschau als Schätzung – ihr tatsächlicher Schaden steht noch nicht fest. Vorhandene Schäden werden weiterhin exakt berechnet, mit den schwersten Schäden zuerst. 💚

Auf dem Handy stehen die Karten untereinander, am Desktop nebeneinander. Eure Mengen und geöffneten Details bleiben beim Cloudabgleich erhalten.

## Aktivierung

Sebastian prüft und mergt den PR. Erfolgreiche GitHub-Pages-Veröffentlichung abwarten und das Spiel neu laden.

Keine SQL und keine neue Game-command erforderlich. swift-handler, Auth-Einstellungen und Kampfengine bleiben unverändert. News-Entwurf noch nicht veröffentlicht.
