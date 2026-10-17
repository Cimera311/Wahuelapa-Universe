# Neuer Hangar für PvP-Angriffe

Die PvP-Angriffsplanung verwendet dieselben Schiffskarten wie PvE und eigene Flottenaufträge. Verfügbare Kampfschiffe und Beutefrachter stehen in getrennten Gruppen. Slider, genaue Zahleneingabe, individuelle „Keine“ / „Alle“-Tasten und die globale Auswahl bleiben synchron. Die Zusammenfassung zeigt Schiffe und Laderaum direkt vor der Flugvorschau und dem Startbutton.

Die Startübersicht zeigt Start, Ziel, Flugzeit, Treibstoff, Gründungsschutz und die belegten Angriffsplätze. PvE-Angriffsflotten einschließlich ihrer Rückflüge zählen bei der Platzanzeige genauso mit wie auf dem Server. Bei Zielschutz, belegten Plätzen, pausiertem PvP, fehlendem Treibstoff, ungültiger Flotte oder fehlenden Schiffen bleibt der Start gesperrt. Nach Ablauf des Zielschutzes wird die Anzeige ohne Austausch des Sliders aktualisiert. Der Server prüft jeden Angriff weiterhin verbindlich.

Der Befehlsvertrag bleibt unverändert: unpräfixierte Schiffsnamen im Formular und genau ein `attack`-Auftrag mit `from`, `to` und `fleet`. Auswahl und Ziel bleiben nach einer Aktualisierung oder einem Cloudabgleich erhalten. Ist der Bestand inzwischen gesunken, bleibt die alte Menge sichtbar und der Start gesperrt, statt Schiffe stillschweigend aus der Auswahl zu entfernen.

Kampfsystem, Kampfwerte, Beute und Flugregeln bleiben unverändert. Keine Änderungen am Spielserver oder an der Datenbank.

## Vorschau

Browser-Aufnahmen mit Beispielbeständen:

- `docs/previews/pvp-hangar-mobile.png`
- `docs/previews/pvp-hangar-desktop.png`

## News-Entwurf · noch nicht veröffentlicht

**⚔️ Neuer Hangar für eure PvP-Angriffe!**

🛸 Unter **Flotten → PvP → Angriff** stellt ihr eure Angriffsflotte jetzt mit den neuen Schiffskarten zusammen. Kampfschiffe und Beutefrachter sind übersichtlich getrennt.

🎚️ Nutzt Slider, genaue Zahleneingabe oder „Keine“ / „Alle“. Eure Flottenübersicht zeigt sofort Schiffe und Laderaum.

🧭 Vor dem Start seht ihr Ziel, Flugzeit, Treibstoff, Gründungsschutz und belegte Angriffsplätze. Auch eure Piraten-Angriffsflotten zählen bei den gemeinsamen Plätzen mit. Fehlt noch eine Voraussetzung, zeigt die Übersicht den Grund.

❤️ Eure Kampfwerte und Regeln bleiben unverändert. Wir wünschen euch viel Spaß beim Zusammenstellen eurer nächsten Flotte!

## Aktivierung

PR prüfen und mergen → Pages-Deployment abwarten → Spiel neu laden. Keine neue Game-command und keine SQL erforderlich. Den News-Entwurf bei gewünschter Veröffentlichung separat übernehmen.
