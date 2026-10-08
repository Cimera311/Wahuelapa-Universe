# Gemeinsame Galaxie · erste spielbare Ausbaustufe

Einmal **supabase/galaxy.sql** im Supabase SQL Editor ausführen, nachdem setup.sql, leaderboard.sql und ship-tiers.sql eingerichtet sind. Ein erneutes Ausführen verändert vorhandene Systeme, Planetenwerte, Besitzer oder Startplätze nicht. Es werden keine existierenden Tutorial-Spielstände gelöscht.

Unter **Galaxie → Mein Tutorial / Gemeinsame Galaxie** bleiben die privaten Tutorial-Welten getrennt von zehn gemeinsamen Systemen. Jedes System erhält bei der SQL-Installation einmal eine zufällige Anzahl von 3–10 Planeten und zufällige Vorkommen. Jeder angemeldete Spieler erhält einen einmaligen, zufälligen Startplatz auf einem gleich großen Ring am Rand. Der Startplatz bleibt auf allen Geräten gleich. Es werden nur der eigene private Tutorial-Start und öffentliche gemeinsame Systeme angezeigt.

## Erkundung und Besiedlung

- Fernsonde bauen: Werft 2, Sensortechnik 2, Staustrahltriebwerke 1. Kosten 280 Metall / 200 Kristall / 80 Treibstoff, Bauzeit 10 Sekunden.
- System und Planet wählen, Fernsonde losschicken. Bei Ankunft werden nur diesem Spieler Name, Typ, Vorkommen, Energiebedarf und Besitzer angezeigt. Die Sonde kehrt danach zurück. Die Erkundung eines Planeten enthüllt nicht automatisch die übrigen Planeten des Systems.
- Kolonisierung 4–6 erlaubt 1–3 gemeinsame Kolonien zusätzlich zu den drei reservierten Tutorial-Plätzen. Die üblichen Triebwerksvoraussetzungen für diese Forschung bleiben bestehen.
- Interstellares Kolonieschiff bauen: Werft 3, Kolonisierung 4, Staustrahl 1. Kosten 1200/850/400, Bauzeit 30 Sekunden.
- Ein untersuchtes, freies Ziel kolonisieren. Der Server reserviert es beim Start atomar; bei Ankunft wird es dauerhaft zu deiner Kolonie. Das Schiff wird verbraucht. 350 Metall, 250 Kristall und 100 Treibstoff werden zusätzlich als Startmaterial mitgenommen und eingelagert.
- Neue Kolonien erscheinen im normalen Planetenmenü. Bauen, Produktion, Forschung und eigene Flottenaufträge funktionieren dort. Für Flüge zwischen verschiedenen Systemen benötigen Frachter/Kriegsschiffe einen Staustrahl-, Impuls- oder Hyperraumantrieb. Der kleine Transporter und Kurier bleiben im Tutorial-System.

Galaxieflüge sind serverseitige Missionen mit echten UTC-Zeiten. Die Karte und Gesamtübersicht zeigen diese Flotten zusätzlich zu den bisherigen lokalen Missionen. Der Browser aktualisiert ungefähr alle 15 Sekunden; manuell ist „Galaxie aktualisieren“ möglich. Abgeschlossene Rückflüge und Kolonien werden beim nächsten Abgleich eingelöst, auch nach Abwesenheit, und genau einmal verarbeitet. Sondenergebnisse werden bereits nach dem Hinflug sichtbar.

## Entfernung und Kosten

Galaxieentfernung: euklidischer Abstand vom tatsächlichen Startsystem bzw. privaten Startplatz, geteilt durch 40, plus 0,15 pro Planetenplatz; mindestens 1 AE. Neue Galaxieflüge benötigen `ceil((60 + Entfernung × 25) / (1 + Staustrahlstufe × 0,12))` Sekunden pro Strecke. Fernsonden verbrauchen `ceil(Entfernung × 6 / Antriebsfaktor)` für Hin- und Rückflug. Kolonieschiffe verbrauchen `ceil(Entfernung × 18 / Antriebsfaktor)` für den Hinflug. Bestehende eigene Handelsaufträge verwenden die Flottenformeln und den Sparflugmodus.

## Speicherung, Besitzer und Datenzugriff

Die neuen Tabellen sind durch RLS und entzogene Tabellenrechte geschützt. Zugriffe laufen über authentifizierte RPCs. Unbekannte Planetenantworten enthalten ausschließlich ID, System, Platz und `surveyed:false`; keine geheimen Werte oder Besitzer. Andere Spieler können die privaten Untersuchungsdaten nicht über interne RPCs auslesen.

Galaxieaktionen sperren den betreffenden Spielstand und prüfen dessen Revision. Reservierungen sperren den Zielplaneten. Lokale Spielaktionen pausieren während des kurzen Serverabgleichs; bei einem Konflikt muss der aktuelle Cloud-Spielstand geladen werden. Imports alter Sicherungen und „Neues Spiel“ dürfen bestehende gemeinsame Kolonien nicht entfernen. Eine bewusste Aufgabe von Kolonien ist noch nicht implementiert; deshalb lehnt der Server solche Änderungen ab. Ein Serverfehler lässt die Tutorialwelt und lokale Sicherung erhalten.

Die Wirtschaft des bisherigen Prototyps wird weiterhin teilweise im Browser simuliert und als Spielstand übertragen. Diese Erweiterung ist kein vollständiger Schutz gegen manipulierte Ressourcen oder Schiffszahlen. Planetengeheimnisse, Besitzer, Reservierungen, Galaxie-Flugzeiten und deren Abschluss werden dagegen vom Server verwaltet. Angriffe, fremde Flotten, Handel mit anderen Spielern und aktive Verteidigung folgen später.

## Prüfung

`npm ci`, `npm test`, `npm run build`. Die Tests verwenden PGlite (echtes PostgreSQL in WASM) für das SQL einschließlich Zugriffsrechte, private Erkundung, Reservierungen, Kosten, einmalige Ankünfte, Ranglistenflotten, alte Imports und Revisionskonflikte. Die Tests ersetzen nicht den abschließenden Test am echten Supabase-Projekt nach Installation des SQL.

Grafikquellen: Drive-Paket galaxy-concepts-v1, Nebelhintergrund und Zentralstern als WebP komprimiert; vorhandene Planetenbilder bleiben bestehen. Die Karten sind HTML/CSS/SVG mit Zoom, Verschieben, Systemauswahl und einer zugänglichen Planetenliste.

## Spieler-Sonnensysteme
Nach `galaxy.sql` zusätzlich `supabase/player-systems.sql` ausführen. Diese Datei ist wiederholbar. Wird `galaxy.sql` erneut ausgeführt, anschließend auch `player-systems.sql` erneut ausführen.
Unter **Galaxie → Mein Sonnensystem** den Namen (1–30 Zeichen) speichern. Er wird mit dem Spielstand synchronisiert. Für angemeldete Spieler sind Systemname, Commander-Name und feste Startposition öffentlich. Planeten, Ressourcen, Forschungen, E-Mail-Adressen und Spielstände bleiben privat. Bestehende Cloud-Konten erhalten bei der Migration ihre Startposition; neue Konten erscheinen nach dem ersten Galaxie-Abgleich. Die Anzeige bezeichnet registrierte Welten und zeigt keinen Online-Status.
