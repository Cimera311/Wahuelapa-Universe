# WaHueLaPa Universe – Grafikassets

Transparente WebP-Varianten der für dieses Projekt generierten PNG-Originale. 768 × 768 Pixel, Qualität 88, Originaltransparenz erhalten.

Originale: https://drive.google.com/drive/folders/1CQfSpUk9pvmHezrltLzAPI4llj6G1WTv

- home.webp: Heimatwelt Aurelia
- ferrum.webp: Gesteinsplanet Ferrum
- nereus.webp: Eisplanet Nereus
- thalassa.webp: Ozeanplanet Thalassa
- probe.webp: Erkundungssonde
- transport.webp: Kleiner Transporter
- colony.webp: Kolonieschiff

Die Website lädt diese Dateien direkt aus ihrem eigenen assets-Verzeichnis. `npm run build` kopiert sie nach dist/assets. Alle vier Welten behalten dieselbe Zuordnung in der Übersicht, in Planetenkarten und in der Erkundung.

## Neue Schiffskonzepte

kurier.webp, karawane.webp, atlas.webp, arche.webp, falke.webp, waechter.webp, donner.webp und titan.webp stammen aus dem Konzeptpaket ship-concepts-v1 des Nutzers. Quelle: https://drive.google.com/drive/folders/1qW7__lZUPHem81Ev8JOWLuo9vgaiI43i

PNG-Originale wurden ausschließlich auf 768 × 768 skaliert und als WebP (Qualität 88) optimiert. Transparenz und Entwürfe bleiben erhalten. Namen, Baukosten und Rollen stehen als lesbarer UI-Text außerhalb der Bilder.

Galaxiekarten: Nebelhintergrund und Zentralstern aus dem Drive-Konzeptpaket galaxy-concepts-v1 (https://drive.google.com/drive/folders/1T0FJbdOAN4bvkxXpytGY2WlAXAZUao1m), als WebP komprimiert. Kartenobjekte, Orbits und Beschriftungen bleiben HTML/CSS/SVG.

## Zusätzliche Planeten, Gebäude und Forschung (v2)

Die zwölf neuen Planetenbilder ergänzen die vier Originalbilder. Tutorial-Welten bleiben unverändert. Gemeinsame Galaxieplaneten erhalten über ihre ID dauerhaft eines von vier Bildern ihres Typs; Ansichten und Konten verwenden dieselbe Zuordnung. Die Bildwahl verändert keine gespeicherten Werte und benötigt keine SQL-Migration.

- planets-v2: drei weitere Varianten für jeden vorhandenen Typ, 768 × 768 WebP, Qualität 88.
- buildings-research-v1/buildings: Bilder für alle 9 Gebäude, 384 × 384 WebP, Qualität 88.
- buildings-research-v1/research: Bilder für alle 10 Forschungen, 384 × 384 WebP, Qualität 88.

Original-PNGs, vollständige Prompts und ZIPs liegen auf Google Drive:
- Planeten: https://drive.google.com/drive/folders/1vvVwmyPAeXGCsFLqyiogMYjUYyERvW7M
- Gebäude/Forschung: https://drive.google.com/drive/folders/1MXjvQrYnQd_jgVE5PNJTXfasPk05mtWf

PNG-Originale werden für die Website lediglich skaliert und als WebP kodiert; Transparenz bleibt erhalten. Die Website liefert die WebP-Dateien aus dem eigenen assets-Verzeichnis.
