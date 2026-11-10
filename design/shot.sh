#!/bin/bash
# Bruk: design/shot.sh <navn> <url-sti> [bredde] [høyde]
# Tar skjermbilde i nettbrettoppløsning (1340x800) med hodeløs Chrome. Krever at appen kjører på localhost:8080.
W=${3:-1340}; H=${4:-800}
OUT="C:/Prosjekter/kokebok/design/skjermbilder/$1.png"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="C:/Users/rinos/AppData/Local/Temp/kb-shot" --window-size=$W,$H --virtual-time-budget=6000 \
  --screenshot="$OUT" "http://localhost:8080/$2" >/dev/null 2>&1
python -c "from PIL import Image;print('$1', Image.open(r'$OUT').size)"
