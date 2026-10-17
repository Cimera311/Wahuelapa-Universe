# Cloudabgleich: Bedienelemente wieder freigeben

Wenn ein Cloudabgleich neue Spiel- oder PvP-Daten lieferte, wurde die Oberfläche noch bei gesetzter Cloud-Sperre aufgebaut. Dadurch blieben unter anderem die neuen PvE-Slider und Mengenfelder deaktiviert, obwohl die Anfrage bereits abgeschlossen war.

Die Aktualisierung erfolgt nun erst nach Freigabe der Cloud-Sperre. Wird während einer laufenden Anfrage eine Ansicht geöffnet oder anderweitig neu aufgebaut, wird diese nach Abschluss ebenfalls aktualisiert – auch bei unveränderten Serverdaten oder einem Netzwerkfehler. Ausgewählte PvE-Mengen bleiben erhalten. Laufende Anfragen bleiben gegen parallele Spielaktionen gesperrt.

## News-Entwurf · noch nicht veröffentlicht

**🛠️ PvE-Hangar: Auswahl nach Cloudabgleich wieder bedienbar**

🎚️ Wir haben einen Fehler behoben, durch den Slider, Mengenfelder und Schnellwahl nach einem Cloudabgleich gesperrt bleiben konnten. Nach Abschluss des Abgleichs lässt sich eure Flotte wieder zusammenstellen; eure Auswahl bleibt erhalten. ❤️

## Aktivierung

PR mergen, Pages-Deployment abwarten, Spiel neu laden. Keine SQL und keine neue Game-command erforderlich.
