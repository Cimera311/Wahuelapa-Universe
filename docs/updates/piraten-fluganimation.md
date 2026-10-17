# Piratenflüge direkt bei ihren Stationen

Aktive PvE-Einsätze stehen als kompakte Flugbahnen unter ihrer jeweiligen Stationskarte. Der bisherige separate Einsatzblock entfällt. Jede Mission bleibt einzeln sichtbar: Spionage in Cyan, Angriff in Amber, Depotabholung in Grün, Trümmerbergung in Violett.

Startplanet, Hin-/Rückflug, Countdown und tatsächlicher Fortschritt werden angezeigt. Das zur Flotte passende Schiff bewegt sich auf der Flugbahn und dreht beim Rückflug seine Richtung um. Flotte und Ladung lassen sich pro Mission aufklappen; offene Details bleiben bei Serveraktualisierungen erhalten. Mehrere Missionen derselben Station werden untereinander dargestellt.

Die Position leitet sich aus den bestehenden Serverzeitstempeln ab. Der vorhandene UI-Takt aktualisiert Position und Countdown; CSS glättet die Bewegung ohne weitere Netzwerkanfragen. Ein abgelaufener Flug zeigt „Ankunft wird bestätigt …“, bis der Server den Phasenwechsel bestätigt. Wartende Rückkehrer bleiben am Startplaneten mit dem Hinweis auf fehlenden Lagerplatz. Reduzierte Bewegung wird berücksichtigt.

Validierung: 409 Tests erfolgreich, Build erfolgreich. Zusätzlich Desktop und Mobile im Browser visuell geprüft: sechs parallele Flüge, keine fehlenden Bilder, bei 390 px kein horizontaler Überlauf. Browserprüfung der tatsächlichen Schiffsbewegung und von prefers-reduced-motion erfolgreich.

## Aktivierung

PR mergen, Pages-Deployment abwarten und Spiel aktualisieren. **Keine SQL und keine neue Game-command erforderlich.** Der PvE-Adminzugang und die Missionsregeln bleiben unverändert.

## News-Entwurf – noch nicht veröffentlichen

🚀 **Piratenflüge jetzt direkt im Blick!**

Spionagesonden, Angriffsflotten und Bergungsfrachter bekommen animierte Flugbahnen direkt bei ihrer Piratenstation. Ihr seht Startplanet, Flugrichtung und Countdown; Flotte und Ladung könnt ihr aufklappen.

🏴‍☠️ Der Piratenbereich bleibt vorerst im Admin-Test. Für alle anderen steht weiterhin „Coming soon“ am Reiter.
