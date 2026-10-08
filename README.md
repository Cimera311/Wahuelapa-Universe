# WaHueLaPa Universe · Prototyp 0.1

Ein tatsächlich spielbarer deutscher Weltraum-Aufbauprototyp. Hauptplanet ausbauen, Forschung freischalten, mit Sonden drei unterschiedliche Welten erkunden, maximal zwei Kolonien gründen und Materialien mit Transportern liefern. Gastmodus ohne externe Dienste und Laufzeitbibliotheken. Kleine optionale Anmeldung und private Cloud-Spielstände sind vorbereitet; Einrichtung in [CLOUD_SETUP.md](CLOUD_SETUP.md).

## Direkt ausprobieren

`START_HERE.html` enthält Oberfläche und Spiellogik; die neuen Grafiken liegen daneben im Ordner `assets`. Beide zusammen auf einem Desktop im Browser öffnen. Manche Browser oder Dateivorschauen schränken JavaScript bzw. lokale Speicherung bei lokalen Dateien ein. Dann das Projekt mit einem lokalen HTTP-Server öffnen:

```sh
python3 -m http.server 8080
```

Danach `http://localhost:8080/` aufrufen. Alternativ `npm run dev` (benötigt Python 3). Ein GitHub-Pages-Link funktioniert ohne Einrichtung auf den Geräten der Mitspieler. Die Spielstand-URLs unterscheiden sich: Ein lokaler Spielstand wird nicht automatisch auf GitHub Pages übertragen; dafür vorher exportieren und auf der veröffentlichten Seite importieren.

## Erste Kolonie in einer kurzen Testsession

1. Einen Commander-Namen wählen. Der Name ist kein Login.
2. Unter **Bauen** Forschungslabor Stufe 1 errichten.
3. Unter **Forschung** Sensortechnik Stufe 1 erforschen.
4. Schiffswerft bauen, unter **Flotten** eine Sonde bauen.
5. Unter **Galaxie** Sonde senden. Nach der Ankunft erscheinen echte Vorkommenswerte. Die Sonde kehrt anschließend zurück.
6. Labor Stufe 2 bauen; Kolonisierung Stufe 1 erforschen.
7. Kolonieschiff bauen; eine erkundete Welt besiedeln. Das Schiff wird verbraucht. Zusätzlich nimmt es 350 Metall, 250 Kristall und 100 Treibstoff aus dem Startplaneten mit. Die Kolonie beginnt mit Solarenergie Stufe 2.
8. Transporttechnik erforschen und auf Aurelia einen Transporter bauen. Kolonie über den Planetenschalter auswählen und ihre Minen ausbauen.
9. Transporter von Aurelia zur Kolonie mit etwa 500 Metall, 350 Kristall und 50 Treibstoff schicken. Nach Rückkehr dort ebenfalls eine Werft und eigene Transporter bauen, um ihre Rohstoffe nach Aurelia zu schicken. Transportmissionen sind zunächst Hinflug mit Lieferung und leerer Rückflug; es gibt keinen automatischen Abholauftrag.

**Planetenauswahl:** Ferrum fördert besonders viel Metall; Nereus viel Treibstoff, benötigt aber mehr Energie; Thalassa ist kristallreich und erlaubt später Gezeitenkraftwerke. Forschung ist global, Gebäude und Bestände sind lokal. Jede Welt hat einen Bauauftrag und einen Schiffbauauftrag; eine Forschung läuft imperiumsweit parallel.

## Speichern

Automatische lokale Speicherung mit letzter Sicherung. Im Zahnradmenü befinden sich Export, Import und bestätigter Neustart. Auf einem anderen Gerät zunächst ein Spiel starten, danach die Sicherung importieren. Browserdaten löschen kann Fortschritt entfernen. Private Browserfenster eignen sich nicht für dauerhaften Fortschritt. Das Spiel fragt keinen Server ab und verwendet die Gerätezeit. Mehrere Tabs werden mit Web Locks schreibgeschützt; in Browsern ohne Web Locks sperrt eine fremde Speicheränderung den zweiten Tab. Eine angezeigte Speicherung beschreibt nur diesen Browser.

Bei voller Lagerkapazität stoppt die Produktion der betreffenden Ressource. Ankommende Überschüsse warten in einem **Lieferdepot**; sie werden automatisch in das Lager übernommen, sobald Ausgaben Platz schaffen. Ladung und Schiffe werden beim Abflug reserviert. Angezeigte Flugkosten umfassen beide Strecken. Ein Kolonieschiff hat keine Rückkehr.

## Auf GitHub Pages veröffentlichen

Der Prototyp liegt im Repository `Cimera311/Wahuelapa-Universe`. Ein Spiel-Link ist erst nach erfolgreicher GitHub-Pages-Veröffentlichung aktiv.

### Einfachste Veröffentlichung ohne Build

Unter **Settings → Pages → Build and deployment** wählen:

- **Source:** Deploy from a branch
- **Branch:** main
- **Folder:** / (root)

Die Datei `index.html` lädt die relativen Module aus `src`. Es werden keine Abhängigkeiten installiert. Danach zeigt GitHub den bestätigten Pages-Link an. Der erwartete Standardpfad ist `https://Cimera311.github.io/Wahuelapa-Universe/`.

### Alternativ: automatischer Build mit GitHub Actions

Unter **Settings → Pages → Source: GitHub Actions** wählen. Der mitgelieferte Workflow `Deploy Imperium to Pages` testet die Simulation, erzeugt die eigenständige Datei in `dist` und veröffentlicht sie. Falls der erste Lauf vor der Pages-Einrichtung scheitert, unter **Actions** erneut ausführen.

Alle Assets sind inline oder relativ. Es gibt keinen fest eingebauten Repository-Basispfad. Bestehende lokale Spielstände vor dem Wechsel auf die Pages-Adresse exportieren und dort importieren.

## Entwicklung und Prüfung

Node.js 20 oder neuer, keine npm-Installation nötig:

```sh
npm test
npm run build
```

Dateien:

- `src/config.js`: Gebäudetypen, Forschungen, Schiffe und Planetenwerte.
- `src/engine.js`: chronologische Simulation und atomare Spielaktionen.
- `src/storage.js`: Validierung, Speichern und Wiederherstellen.
- `src/app.js` / `src/style.css`: echte Oberfläche und dekorative CSS-Planeten.
- `tests/engine.test.js`: 13 Simulationstests.
- `scripts/build.js`: statischer Build ohne Abhängigkeiten; erzeugt `dist/index.html` und `START_HERE.html`.

**Verifiziert am 8. Oktober 2026:** Alle 13 Tests bestanden; Build erfolgreich. Geprüft: Abwesenheit als Gesamtintervall versus Teilschritte, Produktionswechsel bei Fertigstellung, Energie und Lagergrenzen, gesperrte Aktionen, Sondenrückkehr, Kolonisierung, Ressourcen- und Schifferhaltung bei Transporten, Lieferdepot, Weg von unverändertem Startspiel zur ersten Kolonie und Lieferung, Laderaumprüfung, Spielstand-Roundtrip ohne Doppelvergütung, ungültige Importe, Sicherungswiederherstellung und parallele Aufträge.

**Prüfgrenze:** Kein ausführbarer Browser war im Entwicklungsumfeld verfügbar. Handy-/Desktop-Layout und echte Browserbedienung müssen nach Öffnen noch geprüft werden. Die Planetendarstellung ist bewusst aus CSS aufgebaut, nicht identisch mit den früheren Bildkonzepten. Dies ist ein erster Prototyp und kein fertig balanciertes Langzeitspiel.

## Bewusst für später

Gemeinsames Leaderboard, NPC-Raids, automatische Transportrouten und der große Endgame-Entwicklungsbaum. Keine dieser Funktionen wird vorgetäuscht. GitHub Pages allein kann keine gemeinsamen Cloud-Spielstände speichern. Die optionale Supabase-Anbindung für private Cloud-Spielstände ist vorbereitet, aber erst nach der Einrichtung aktiviert. Für faire gemeinsame Ranglisten fehlen noch serverseitig geprüfte Spielaktionen.

## Optionale Anmeldung

Siehe [CLOUD_SETUP.md](CLOUD_SETUP.md) für E-Mail/Passwort und private Cloud-Spielstände. Der Live-Gastmodus bleibt aktiv, bis ein Supabase-Projekt eingerichtet ist. 22 Tests bestehen; die Cloud-Tests verwenden ein simuliertes Backend, keine echte Anmeldung.

## Flotten und Handelsrouten

Unter **Flotten** findest du den Hangar der aktiven Welt, den Schiffbau und eine Übersicht aller stationierten und reisenden Schiffe. Liefern bringt Material zum Ziel und die Transporter zurück. Abholen lädt erst bei Ankunft am Ziel. Stationieren verlegt einen Schiffstyp dauerhaft; Transporter können Material mitnehmen.

Laderegeln akzeptieren ganze Mengen oder `max`. Die Priorität bei begrenztem Laderaum ist Metall, Kristall, Treibstoff. Lokale Reserven schützen Bestände vor Flottenbeladung, einschließlich Lieferdepot; Bau und Forschung dürfen Reserven verwenden. Einzelne Liefer- und Stationierungsaufträge weisen zu große exakte Mengen zurück. Handelsstopps und Abholungen laden bis zu den gewünschten Mengen, soweit Bestand und Laderaum reichen.

Handelsrouten haben 2–12 Stopps, beginnen auf der aktiven Welt und kehren automatisch dorthin zurück. An jedem Zwischenstopp wird erst abgeladen und dann eingeladen. Bei Rückkehr wird die komplette Restladung eingelagert. Eine Route kann einmalig oder wiederholt laufen. „Route nach dieser Runde beenden“ bringt Schiffe und Material sicher zum Start zurück. Treibstoff wird für jede vollständige Runde dort vorab bezahlt; fehlt er, endet die Route dort. Flugkosten berücksichtigen Strecke, Transporterzahl und Antriebstechnik. Ob eine Route Treibstoff spart, hängt von ihrer Reihenfolge ab.

Routen werden während Abwesenheit chronologisch simuliert. Nach außergewöhnlich langer Abwesenheit mit mehr als 100.000 Ereignissen enden automatische Routen nach ihrer aktuellen Runde mit einem Bericht; die Wirtschaft läuft bis zur aktuellen Zeit weiter. Spielstandformat und bestehende Cloud-/Ranglisten-SQL bleiben kompatibel. Für diese Erweiterung ist kein zusätzliches SQL erforderlich.
