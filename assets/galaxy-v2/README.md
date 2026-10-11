# Systemreise · Asset-Set v1

Vorbereitung für Galaxie-Entwurf 3. Noch nicht in der Spieloberfläche eingebunden.

| Datei | Zweck |
| --- | --- |
| system-background-v1.png | Dunkler Nebelhintergrund, ruhige Mitte für Planeten und lesbare Labels |
| sun-amber-v1.png | Orange Sonne mit transparentem Hintergrund und freiem Rand |
| orbits-v1.svg | Vier dezente Umlaufbahnen, unabhängig von den Bildern skalierbar |
| selection-ring-v1.svg | Klarer Auswahlring ohne eingebackene Beschriftung |

Weiterverwendete Planeten: `../planets-v2/continental-v1.webp`, `rock-v1.webp`, `ice-v1.webp`, `ocean-v1.webp`. Die bestehenden Planeten bleiben die visuelle Identität des Spiels; es wurden dafür keine zusätzlichen Bildgenerierungen verbraucht.

Hintergrund und Sonne wurden mit dem eingebauten Imagegen erzeugt. SVGs sind handgeschriebene UI-Grafiken. Die Bilddateien sind Original-PNGs; vor Live-Integration können WebP-Versionen ergänzt werden. Bilder einzeln positionieren, damit Planeten später auswählbar bleiben. Labels und Aktionen als HTML, Umlaufbahnen als dekorative Ebene, Auswahl zusätzlich durch Text und aria-pressed anzeigen. Bei kleinen Displays Details unter die Szene verschieben. Die Beispiel-Umlaufbahnen sind dekorativ, keine Simulation von Flugentfernungen.

Lokale Kombination mit echten Assets: `http://127.0.0.1:8765/galaxy-system-assets-preview/` (Beispieldaten, keine Serveranfragen).

## Bildvorgaben für die Generierung

- Hintergrund: Landschaft 16:9, sehr dunkles Navy, dezente blau-türkise Nebel an den Rändern, wenige Sterne, ruhige zentrale 65 Prozent für Sonne/Planeten/Labels, kleine warme Staubakzente unten rechts. Keine Planeten, Schiffe, Texte oder UI im Bild.
- Sonne: isolierte realistische orange Sonne, quadratisches transparentes Bild, feine Oberflächentextur, zwei kleine Protuberanzen, zurückhaltende Corona, transparenter Sicherheitsabstand außen, keine Texte, Umlaufbahnen oder weiteren Himmelskörper. Für eine Darstellung von ungefähr 100–220 Pixeln vorgesehen.
