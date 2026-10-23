#!/usr/bin/env python3
"""Build tiny alpha-transparent WebP icons from Concept v3 originals.

Run: python -m pip install Pillow && python scripts/generate_ship_icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "ship-concept-v3"
DEST = ROOT / "assets" / "ship-icons-v3"
ASSETS = {
    "falke": "falkeassetv3.png",
    "waechter": "wävhterassetv3.png",
    "donner": "Donnerassetv3.png",
    "titan": "titanassaetv3.png",
    "kurier": "Kurierv3.png",
    "transport": "kleinerTransporterv3.png",
    "karawane": "Karavanev3.png",
    "atlas": "Atlasv3.png",
    "arche": "Archev3.png",
    "spyProbe": "Spionagesonde_Asset_Concept_v3.png",
    "probe": "Erkundungssonde_Asset_Concept_v3.png",
    "longProbe": "Fernsonde_Asset_Concept_v3.png",
    "colony": "Kolonieschiff_Asset_Concept_v3.png",
    "starColony": "Interstellares_Kolonieschiff_Asset_Concept_v3.png",
}

def main():
    missing = [name for name in ASSETS.values() if not (SOURCE / name).is_file()]
    if missing:
        raise SystemExit("Missing Concept-v3 sources: " + ", ".join(missing))
    DEST.mkdir(parents=True, exist_ok=True)
    for key, name in ASSETS.items():
        with Image.open(SOURCE / name) as img:
            img = img.convert("RGBA")
            bbox = img.getchannel("A").getbbox()
            if bbox:
                img = img.crop(bbox)
            img.thumbnail((116, 116), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
            canvas.alpha_composite(img, ((128-img.width)//2, (128-img.height)//2))
            out = DEST / f"{key}.webp"
            canvas.save(out, "WEBP", quality=79, method=6)
            print(f"{key}: {out.stat().st_size:,} bytes")
if __name__ == "__main__":
    main()
