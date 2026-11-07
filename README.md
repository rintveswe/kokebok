# Familiekokeboka

Digital kokebok (PWA) for nettbrett på kjøkkenet, med egen handlelisteapp.

## Mapper
- `app/` – selve appen. Hele mappen publiseres som den er.
  - `data/recipes/*.json` – én fil per rett. `data/index.json` lister dem. `data/schema/` beskriver formatet.
  - `data/profiles.json` – familieprofiler (`mild: true` = mild versjon av sterke retter).
  - `handleliste/` – installerbar handlelisteapp.
- `hardware/` – kommer: nettbrettholder (3MF), når nettbrettet er kjøpt.

## Kjøre lokalt
```
cd app
python -m http.server 8080
```
Åpne http://localhost:8080

## Legge til en rett
1. Lag `app/data/recipes/<id>.json` (følg `data/schema/recipe.schema.json`).
2. Legg `<id>` til i `app/data/index.json`.
3. Sett `"status": "testet"` når dere har laget retten. Bare testede retter kommer med i den trykte boka.
4. Bilder: legg `.webp` i `app/data/images/` og sett `"image": "data/images/<id>.webp"`.

## Publisere på GitHub Pages
1. Lag et nytt repo på github.com (f.eks. `kokebok`).
2. I mappen `C:\Prosjekter\kokebok`:
   ```
   git init
   git add .
   git commit -m "Første versjon"
   git branch -M main
   git remote add origin https://github.com/<bruker>/kokebok.git
   git push -u origin main
   ```
3. På GitHub: Settings → Pages → Source: «GitHub Actions», eller «Deploy from a branch» med mappen `/app` hvis den er tilgjengelig. Hvis ikke: flytt innholdet i `app/` til rotmappen i et eget repo.
4. Åpne adressen på mobilen → Del → «Legg til på Hjem-skjerm». Gjør det samme for `/handleliste/`.

Merk: repoet er offentlig på gratis GitHub.
