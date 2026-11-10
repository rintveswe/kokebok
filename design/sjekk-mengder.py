"""Sjekker «ingredients» i stegene i alle oppskriftene.

Hvert navn et steg peker på, må treffe nøyaktig én ingrediens i oppskriftens ingrediensliste.
Skriptet sier også fra om ingredienser som ikke er nevnt i noe steg (bare til opplysning).

Kjør fra prosjektmappen:  python design/sjekk-mengder.py
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

DATA = Path(__file__).resolve().parent.parent / "app" / "data"
feil, merknader = [], []

for rid in json.loads((DATA / "index.json").read_text(encoding="utf-8")):
    r = json.loads((DATA / "recipes" / f"{rid}.json").read_text(encoding="utf-8"))
    brukt = set()
    for n, steg in enumerate(r.get("steps", []), start=1):
        for ref in steg.get("ingredients", []):
            o = {"name": ref} if isinstance(ref, str) else ref
            treff = [i for i, ing in enumerate(r["ingredients"])
                     if ing["name"] == o.get("name") and ("group" not in o or ing.get("group") == o["group"])]
            if len(treff) == 1:
                brukt.add(treff[0])
            elif not treff:
                feil.append(f"{rid}, steg {n}: finner ikke «{o.get('name')}» i ingredienslisten")
            else:
                feil.append(f"{rid}, steg {n}: «{o.get('name')}» står flere steder – legg til \"group\"")
    if any("ingredients" in s for s in r.get("steps", [])):
        for i, ing in enumerate(r["ingredients"]):
            if i not in brukt:
                merknader.append(f"{rid}: «{ing['name']}» er ikke nevnt i noe steg")

for m in merknader:
    print("Merk:", m)
for f in feil:
    print("FEIL:", f)
print(f"\n{len(feil)} feil, {len(merknader)} merknader.")
sys.exit(1 if feil else 0)
