# Designsystem – «Kveldsservering»

Mørkt rom, messing og menykort. Lyset ligger på maten. Appen skal føles som menyen på en god
restaurant: rolig, sikker og lett å lese på en armlengdes avstand med mel på fingrene.

Alt som står her, finnes som kode i `app/css/system.css` (verdier og komponenter) og
`app/js/ui.js` (ikoner, varsel, lukking av skuff og dialog). Skjermenes oppsett ligger i
`app/css/style.css` (kokeboka) og `app/handleliste/style.css` (handlelisten).

## Fem regler som ikke brytes

1. **Bare `transform` og `opacity` animeres.** Aldri høyde, bredde, skygge, uskarphet eller farge på store flater.
2. **Alt som kan trykkes er minst 56 px** i begge retninger (`--tap`). De viktigste knappene er minst 64 px (`--tap-lg`).
3. **Bruk bare verdiene i tabellene under.** Trengs en ny farge eller størrelse, legges den til her først.
4. **Alt ligger lokalt.** Fonter, ikoner og bilder hentes aldri fra andre nettsteder, så appen virker uten nett.
5. **Norsk tekst overalt**, også i `aria-label`.

## Farger

| Navn | Verdi | Brukes til | Kontrast mot `--bg` |
| --- | --- | --- | --- |
| `--bg` | `#0E0C0A` | Rommet: bakgrunnen på alle skjermer | – |
| `--bg2` | `#171411` | Sidefelt og skuffer | – |
| `--card` | `#1D1915` | Kort | – |
| `--raise` | `#27211B` | Det som ligger øverst: varsler og dialoger | – |
| `--text` | `#F1EADF` | Titler og viktig tekst | 16:1 |
| `--soft` | `#D3CABC` | Lengre tekst som ikke skal rope | 12:1 |
| `--muted` | `#A99F90` | Dempet tekst, plassholdere | 7,5:1 |
| `--brass` | `#D4A960` | Merkefargen: etiketter, valgt, hovedknapp | 9:1 |
| `--brass-hi` | `#E9C785` | Lys messing til små høylys | 12:1 |
| `--on-brass` | `#16110A` | Tekst oppå messing | 8,6:1 mot messing |
| `--ember` | `#E8754A` | Sterk mat, «offline», advarsler | 6,5:1 |
| `--sage` | `#A9C29B` | «Alt i orden» (synkronisert) | 10:1 |
| `--line` / `--line2` | kremhvit 16 % / 34 % | Skillestreker / kanter på knapper og felt | – |
| `--brass-line` / `--brass-wash` | messing 55 % / 9 % | Messingstrek / svak messingflate ved trykk | – |

Også på de lyseste flatene (`--raise`) har all tekst minst 5,4:1, som er over kravet (4,5:1). Messing brukes sparsomt: én ting
på hver skjerm skal lyse mest – som regel hovedknappen.

Personfargene i handlelisten (små prikker) er egne: Rino `#8FBF9F`, Iselin `#E0A15E`,
Fia `#B79AD6`, Rakel `#E58CA5`, Hugo `#7FB2DA`.

## Typografi

To fonter. **Bodoni Moda** (serif med høy kontrast) er stemmen – titler, stegtekst og tall.
**Jost** (geometrisk grotesk) er alt det praktiske – brødtekst, knapper og etiketter.

| Rolle | Verdi | Brukes til |
| --- | --- | --- |
| `--t-display` | Bodoni 500, 4,3 rem / 1 | Rettens navn |
| `--t-title` | Bodoni 500, 3,3 rem / 1,05 | Skjermtittel |
| `--t-step` | Bodoni 500, 3 rem / 1,22 | Instruksjonen i steg-modus |
| `--t-head` | Bodoni 500, 2 rem / 1,1 | Korttittel |
| `--t-lead` | Jost 300, 1,4 rem / 1,45 | Ingress |
| `--t-read` | Jost 400, 1,3 rem / 1,45 | Lesetekst: tips og ingredienser |
| `--t-body` | Jost 400, 1,15 rem / 1,45 | Vanlig tekst og knapper |
| `--t-small` | Jost 400, 1,02 rem / 1,4 | Merknader |
| `--t-label` | Jost 500, 0,82 rem, VERSALER, sperret 0,2 em | Etiketter og seksjonstitler |

- Kursiv Bodoni brukes bare til ordmerket, romertall, tomme tilstander og dialogspørsmål.
- Stegteksten har fire størrelser. Korte steg (inntil 70 tegn) settes ekstra stort (3,75 rem).
  Lange steg krymper trinnvis til de får plass – teksten skal aldri måtte rulles.
- `1 rem` følger skjermbredden (16 px ved 1340 px bredde). Da ser oppsettet likt ut på nettbrettet
  uansett pikseltetthet. På mobil og stående skjerm er `1 rem` alltid 16 px.

## Luft, hjørner og skygger

| Type | Verdier |
| --- | --- |
| Luft | `--s1` 0,25 · `--s2` 0,5 · `--s3` 0,75 · `--s4` 1 · `--s5` 1,5 · `--s6` 2 · `--s7` 3 rem |
| Hjørner | `--r` 0,2 rem (skarpt, som et menykort) eller `--pill` (helt rundt). Ingenting imellom. |
| Skygger | `--shadow-plate` (under tallerken og medaljong) og `--shadow-float` (skuff, dialog, varsel). Skygger animeres aldri. |
| Lys | `--spot`: en varm lyskjegle bak tallerken og medaljong. Eneste «effekt» i appen, og den står stille. |

## Bevegelse

| Navn | Verdi | Brukes til |
| --- | --- | --- |
| `--ease` | `cubic-bezier(.2,.7,.2,1)` | Alt som kommer rolig inn |
| `--spring` | `cubic-bezier(.3,1.5,.5,1)` | Liten fjæring: hake, bryter, prikk |
| `--fast` | 0,15 s | Trykkrespons |
| `--med` | 0,3 s | Tilstandsbytte (bryter, felt, valg) |
| `--slow` | 0,55 s | Store flater og bildet som flyr |

Fast koreografi:

- **Trykk:** alt som kan trykkes, krymper litt (`scale(.96)`, runde knapper `.92`) i 0,15 s.
- **Start → rett:** bildet på kortet vokser til det store bildet på rettsiden (delt overgang, 0,55 s). Resten toner inn.
- **Rett ↔ steg-modus:** skjermen toner over og glir 1,5 rem i den retningen du går.
- **Steg → steg:** teksten glir inn fra den siden du blar mot, medaljongen spretter lett, og fremdriftsstreken fylles.
  Rammen (knapper, teller) står helt stille, så fingeren alltid finner «Neste» på samme sted.
- **Lister:** rader kommer inn forskjøvet 35 ms etter hverandre første gang. Etterpå beveger bare det som er nytt eller endret seg.
- **Skuff og dialog:** skuffen glir inn fra høyre (fra bunnen på mobil), dialogen spretter opp. Bakgrunnen dempes.
- **Symbolene i stegene** (hakke, steke, røre osv.) er små løkker med `transform` på ett element.
- Har brukeren bedt om mindre bevegelse i systemet, slås alt dette av.

## Komponenter

| Komponent | Klasse | Merknad |
| --- | --- | --- |
| Etikett | `.label`, `.label.dim` | Messing eller dempet. Brukes som seksjonstittel. |
| Ordmerke | `.wordmark` + `.orn` | «Familie / Kokeboka» med messingstrek og rute under |
| Knapp | `.btn.solid`, `.btn.ghost`, `.btn.big` | Fylt messing = det viktigste på skjermen. Bare én per skjerm. |
| Pille | `.pill`, `.pill.quiet` | Lenker og små handlinger |
| Rund ikonknapp | `.icon-btn`, `.bare`, `.solid` | Tilbake, lukk, slett, legg til |
| Valgbrikke | `.chip`, `.chip.on` | Velg én av flere (hvem legger til) |
| Merkelapp | `.tag`, `.tag.hot`, `.tag.ok` | «Kan sløyfes», «Sterk», «Kladd». Kan ikke trykkes. |
| Bryter | `.switch`, `.switch.on` | Mild versjon |
| Avkrysning | `.check` inni et element med `.on` | Handleliste og handleskuff |
| Skrivefelt | `.field` | Søk og «Legg til vare». Messingkant ved fokus. |
| Tallerken | `.dish` | Der retten ligger når den mangler bilde |
| Medaljong | `.medal` | Der stegets symbol ligger |
| Varsel | `toast('tekst')` | Nederst, forsvinner selv etter 2,8 s |
| Tilstand | `.state` + `.loader` | Laster, tomt og feil – alltid samme oppsett: ikon, kursiv tittel, én setning, én knapp |
| Skuff | `.overlay` + `.sheet` | Handleskuffen |
| Dialog | `.overlay.center` + `.dialog` | Bekreftelse før noe slettes for alle |

Ikonene er tynne strektegninger (1,6 px strek, 24 × 24) som arver tekstfargen, og ligger i `ui.js`.
Emoji brukes bare som «maten» på tallerkenen og symbolet i medaljongen – aldri i knapper eller menyer.

## Bilder

Bildene skal lede an, så retter med bilde vises først på startsiden.

- **Format:** WebP, stående, omtrent 4:5, minst 1200 px på korteste side. Legges i `app/data/images/`.
- **Utsnitt:** bildet fyller alltid flaten (`object-fit: cover`). Flytt utsnittet med `imagePos` i oppskriften, f.eks. `"50% 30%"`.
- **Fast behandling:** en mørk toning oppå bildet – 40–50 % mørkt øverst (bak tilbakeknapp og merkelapp),
  klart i midten, og 94 % mørkt nederst (bak tittel og fakta). På rettsiden tones også høyre kant mot bakgrunnen,
  så bildet glir over i teksten. Samme toning på alle bilder gjør at ulike bilder ser ut som én serie.
- **Ingen filtre** (uskarphet, metning osv.) – de koster for mye på nettbrettet. Vil dere ha en bestemt tone, gjøres det i bildefila.
- **Uten bilde:** retten legges på en lys tallerken i lyskjeglen. Det samme skjer hvis en bildefil ikke lar seg laste.
- **Ferdig-skjermen** viser bildet som en rund tallerken.
- **Motiv:** ta bildene i varmt lys, gjerne mot mørk bakgrunn, med retten i nedre halvdel. Da treffer toningen best.

## Tekst og tone

Korte, rolige setninger. Knapper sier hva som skjer («Start matlagingen», «Legg til 12 varer», «Tøm alt»).
Feil forklarer hva man gjør videre («Sjekk nettet og prøv igjen»). Tomme tilstander peker på neste steg.

## Teste uten å røre familiens handleliste

Handlelisten synkroniseres med hele familien. Mappa `app/_test/` (ligger ikke i Git) åpner de samme
skjermene med en liksom-liste i minnet: `http://localhost:8080/_test/kokebok.html` og
`http://localhost:8080/_test/liste.html`. Skjermbilder tas med `design/shot.sh`.
