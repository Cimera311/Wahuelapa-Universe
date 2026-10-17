# Piratenstationen – Admin-Vorschau

## Umfang

Unter Galaxie gibt es neben Sonnensystem und Galaxie den Reiter „Piraten“ mit dem Hinweis „Coming soon“. Für Gäste und normale Spieler ist er deaktiviert. Nur angemeldete Nutzer mit dem bestehenden, vom Server gelieferten `pvp.isAdmin === true` können die Oberflächenvorschau öffnen. Navigation und Rendering prüfen die Berechtigung; bei Wegfall wird zum Sonnensystem gewechselt. Dies ist ein UI-Vorabstand ohne geschützte PvE-Serverdaten oder neue API. Echte PvE-Aktionen müssen später zusätzlich serverseitig autorisiert werden.

Fünf auswählbare Entwurfsstationen zeigen Stufe, vorläufige Sensoranforderung, Beschreibung und unbekannte Aufklärungswerte. Die vorhandene Orbitalstationsillustration dient als ausdrücklich gekennzeichneter Platzhalter. Alle Einsatzbuttons sind deaktiviert. Keine neuen Missionen, Ressourcen, gespeicherten Stationen, Sensorregeln oder Cooldowns werden angelegt.

## Aktivierung

1. Pull Request nach Prüfung mergen.
2. GitHub-Pages-Deployment abwarten und das Spiel aktualisieren.
3. Als Admin unter Galaxie → Piraten die Stationsauswahl prüfen. Für normale Spieler bleibt „Coming soon“ gesperrt.

**Keine SQL und keine neue Game-command erforderlich.**

## Vorbereiteter News-Entwurf (noch nicht veröffentlichen)

🏴‍☠️ Ein neues Signal am Rand des Sektors …

Unter **Galaxie** findet ihr künftig neben **Sonnensystem** und **Galaxie** den neuen Reiter **Piraten · Coming soon**.

Hier entsteht unser PvE-Bereich mit Piratenstationen verschiedener Stärken. Die erste Oberfläche ist vorerst nur für Admins zur Vorschau zugänglich. Für alle anderen bleibt der Bereich noch gesperrt.

⚠️ Sonden, Piratenangriffe, Belohnungen und Bergung sind noch nicht freigeschaltet. Weitere Details folgen, sobald die nächsten Schritte bereitstehen. 🚀
