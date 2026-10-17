# Handelsrouten mit Hangar-Schiffskarten

Neue Handelsrouten und der Editor bestehender Routen verwenden die gemeinsamen Schiffskarten mit Schiebereglern, direkter Mengeneingabe, „Keine“ und „Alle“. Ausgewählte Frachter werden hervorgehoben; das Manifest zeigt die gesamte Routenflotte und ihren Laderaum. Die Flugzeit- und Treibstoffvorschau folgt der Auswahl.

Beim Bearbeiten zählen freie Schiffe am Startplaneten und die bereits auf dieser Route gebundenen Schiffe jeweils einmal. Bestehende Vormerkungen oberhalb des aktuellen Bestands bleiben bearbeitbar. „Alle“ wählt den tatsächlich verfügbaren Bestand einschließlich der gebundenen Routenflotte. Laufende Routen können weiterhin einen späteren Wechsel vormerken; sofortige Änderungen pausierter Routen benötigen ausreichenden Bestand. Entwürfe bleiben beim Cloudabgleich erhalten.

Stopps, MAX-Beladung, Pausen und die serverseitigen Routenbefehle bleiben bestehen.

## Vorschau

- [Neue Route am Handy](../previews/route-hangar-new-mobile.png)
- [Neue Route am Desktop](../previews/route-hangar-new-desktop.png)
- [Route bearbeiten am Handy](../previews/route-hangar-edit-mobile.png)
- [Route bearbeiten am Desktop](../previews/route-hangar-edit-desktop.png)

## Prüfung

443 Tests bestanden, einschließlich sechs neuer DOM-Tests für die Routenflotte, Vormerkungen, pausierte Routen und Cloudabgleich. Build erfolgreich. Browserprüfung bei 320, 390 und 1365 Pixeln: kein horizontaler Seitenüberlauf, keine fehlenden Bilder und keine JavaScript-Fehler.

## News-Entwurf – noch nicht veröffentlicht

🚚✨ Eure Handelsrouten bekommen den neuen Hangar!

Unter **Flotten → Handel → Handelsrouten** könnt ihr eure Frachter jetzt mit den neuen Schiffskarten zusammenstellen: Menge am Schieberegler ziehen, direkt eintippen oder mit „Keine“ und „Alle“ auswählen. Ausgewählte Schiffe leuchten auf; Flottenübersicht und Laderaum passen sich direkt an. 💚

Beim Bearbeiten seht ihr, welche Frachter frei und welche bereits auf dieser Route unterwegs sind. Vorgemerkte Flottenwechsel bleiben erhalten, auch wenn noch Schiffe fehlen. Laufende Routen übernehmen Änderungen wie gewohnt bei der Rückkehr; pausierte Routen können direkt am Startplaneten angepasst werden. 🪐

## Aktivierung

1. Sebastian prüft und mergt den PR.
2. Erfolgreiche GitHub-Pages-Veröffentlichung abwarten.
3. Spiel neu laden.

Keine SQL und keine neue Game-command erforderlich. Keine Änderungen an swift-handler oder den Auth-Einstellungen. Den News-Entwurf erst nach gesonderter Freigabe veröffentlichen.
