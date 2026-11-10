#!/bin/bash
# Bruk: design/shot.sh <navn> <url-sti> [bredde] [høyde] [skala]
# Tar skjermbilde med hodeløs Chrome. Krever at appen kjører på localhost:8080.
#   Standard: 1340x800 (nettbrettets fysiske piksler, skala 1).
#   Slik nettbrettet trolig ser det: 1007 601 1.333 (56 px trykkflate blir da riktig stor i forhold til resten).
W=${3:-1340}; H=${4:-800}; S=${5:-1}
OUT="C:/Prosjekter/kokebok/design/skjermbilder/$1.png"
# Fersk profil hver gang, ellers serverer en gammel service worker utdaterte filer til skjermbildet.
rm -rf "/c/Users/rinos/AppData/Local/Temp/kb-shot"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="C:/Users/rinos/AppData/Local/Temp/kb-shot" --window-size=$W,$H --force-device-scale-factor=$S \
  --virtual-time-budget=6000 --screenshot="$OUT" "http://localhost:8080/$2" >/dev/null 2>&1
python -c "from PIL import Image;print('$1', Image.open(r'$OUT').size)"
