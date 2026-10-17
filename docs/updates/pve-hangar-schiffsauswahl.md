# PvE-Hangar: Schiffsauswahl mit Slider

Die Piraten-Missionsplanung erhält eine neue Hangar-Oberfläche. Kampfschiffe und Frachter stehen in getrennten Gruppen; nur am Startplaneten verfügbare, für den Auftrag geeignete Schiffe erscheinen. Mengen lassen sich über Slider, genaue Zahleneingabe oder „Keine“ / „Alle“ wählen. Beide Eingaben sind synchron und auf den verfügbaren Bestand begrenzt.

Ausgewählte Karten erhalten einen farbigen Akzent und einen dezenten Antriebsschimmer. Eine Zusammenfassung zeigt Schiffstypen, Mengen und Laderaum; die vorhandene Flugzeit-/Treibstoffvorschau reagiert sofort. Die Auswahl bleibt bei einer Aktualisierung erhalten und wird bei einem Wechsel von Startplanet oder Auftrag zurückgesetzt. Technik und Rollenbeschreibung stehen in aufklappbaren Details.

Der Versuch ist ausschließlich im PvE-Planer eingebaut. Die übrigen Flottenmenüs verwenden weiterhin die bestehende Auswahl.

## Vorschau

- `docs/previews/pve-hangar.html`: eigenständige, interaktive Vorschau mit eingebetteten Bildern und Beispielbeständen; startet keine echten Missionen.
- `docs/previews/pve-hangar-mobile.png` und `pve-hangar-desktop.png`: Browser-Aufnahmen derselben Vorschau.

## News-Entwurf · noch nicht veröffentlicht

**🛸 Neuer Hangar für eure Piraten-Einsätze!**

🏴‍☠️ Unter **Galaxie → Piraten** stellt ihr eure Flotte jetzt in neuen Schiffskarten zusammen. Kampfschiffe und Frachter sind übersichtlich getrennt.

🎚️ Zieht die gewünschte Menge mit dem Slider oder gebt eine genaue Zahl ein. Mit „Keine“ und „Alle“ geht es besonders schnell. Angezeigt werden nur verfügbare Schiffe, die zum Auftrag passen.

💎 Eure Auswahl zeigt sofort Schiffe und Laderaum; Flugzeit und Treibstoff werden wie gewohnt mitberechnet. Zusätzliche Schiffsdetails könnt ihr direkt an der Karte aufklappen.

💬 Wir probieren die neue Auswahl zuerst bei den Piraten aus. Wie fühlt sie sich auf eurem Handy an? Schreibt uns euer Feedback im Chat oder in der Wünschebox! ❤️

## Aktivierung

PR prüfen und mergen, das erfolgreiche Pages-Deployment abwarten und das Spiel neu laden. Keine SQL und keine neue Game-command erforderlich. An Kampfsystem, Belohnungen oder Serverregeln wird nichts geändert. Den News-Entwurf bei gewünschter Veröffentlichung separat in die Spieler-News übernehmen.
