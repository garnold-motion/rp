# The Running Postman

QR-scannable in-venue wine app for The Running Postman, Camberwell. React + Vite,
Google Sheets as the CMS, no backend.

```bash
npm install
npm run dev
```

## Structure

Single-screen tab shell (`Home · Cellar · Find · Visit`) — no router, because the
app is opened by scanning a QR at the table and a history stack only gets in the
way on a phone.

```
src/
  config/
    venue.js      venue details — address, hours, phone, hero image
    sheets.js     Google Sheet id + gids, and the column contract
  data/
    transforms.js normalises messy sheet strings into clean typed objects
    wineLogic.js  the quiz, the flavour pad maths, and all matching/scoring
    prefetch.js   warms the specials cache on startup
  hooks/
    useSheetData.js  fetch + localStorage cache with staleness checking
  components/
    find/         the Find My Wine flow (quiz → pad → reveal)
```

## The sheet

The app reads the venue's own working wine list (the **APP Link** tab),
published to the web as CSV. Staff edit the sheet; the app picks changes up
within 10 minutes. The URL lives in `src/config/sheets.js`.

> A "publish entire document" URL with no `gid` serves the **first** tab in the
> document. If the app ever shows the wrong data, open the sheet, select the
> APP Link tab, read the `gid=` value from the address bar, and set
> `APP_LINK_GID` in `src/config/sheets.js`.

### Columns

| column | notes |
|---|---|
| `Category` | BUBBLES · WHITE · ITALIAN WHITE · ROSE · CHILLED RED · RED · ITALIAN REDS · FORTIFIED. **A blank here means the wine never appears in the app.** |
| `Name` | required. Producer is taken from the text before the first comma, grapes from anything after a ` - ` |
| `Variety` | drives the sub-filter and the taste profile |
| `Country` | optional — recovered from the region suffix when blank |
| `Region` | "Clare Valley, SA" format; the suffix is what identifies the country |
| `Vintage` | a year, or NV / MV. Anything else is ignored |
| `Price Bottle`, `Price Glass` | `$` and thousands commas are stripped automatically |
| `Featured` | TRUE puts the wine on the specials board and the home page |
| `Organic`, `Vegan` | TRUE / FALSE |
| `Cellar` | TRUE moves the wine into the separate back-vintage Cellar List |

### Quirks the parser already handles

The sheet is a human document first, so the transform absorbs a fair bit:

- blank spacer rows, and section banners typed into whichever column was handy
- blend continuation lines (`- Cabernet Sauvignon/Merlot/Petit Verdot`) are
  folded into the wine above them, and that wine's profile is recalculated
- the fortified section has the **price in the Vintage column** — those are
  rejected rather than displayed as a vintage
- organic, vegan and cellar wines are flagged by *repeating* the wine in a
  trailing section. Duplicates are collapsed and the flags merged. `Cellar` is
  first-wins rather than merged, so a wine that's both pouring now and listed in
  the cellar stays on the main list

Anything genuinely broken is reported: rows with a price but no Category are
logged to the browser console at startup.

## How Find My Wine works

Five this-or-that taps, then one drag, then the result.

The quiz never asks anyone to rate their own acidity preference — people don't
know that. It asks concrete sensory questions ("beach at golden hour, or fireside
in winter?") and accumulates a hidden taste vector from the answers. The flavour
pad then seeds its dot from that vector, so the drag starts somewhere meaningful.

### Where the taste data comes from

**The sheet has no taste columns.** No body, sweetness, acidity or tannin
ratings — so the profiles are *estimated from the grape variety* in
`src/data/varietyProfiles.js`, which holds textbook-typical values for every
variety on the list. Riesling comes out light and racy, Barolo full and grippy,
Sauternes sweet.

This is good enough to make the recommender useful and it needs no work from the
venue, but it can't tell a lean Barossa Shiraz from a blockbuster one. The wine
detail sheet says so rather than presenting the numbers as fact.

If you ever want real per-bottle accuracy, add `body`, `sweetness`, `acidity` and
`tannins` columns (1–10) to the sheet — `resolveProfile()` already prefers real
data over its estimate wherever it finds it, no code change needed.

Scoring is a weighted distance between the target vector and each wine, in
`scoreWines()`. Sweetness carries the heaviest weight because getting it wrong is
the most jarring error; tannins are lightest and only counted for reds, skin
contact and fortified. Food pairing is a nudge rather than a hard filter, so a
great wine slightly off the plate still beats a mediocre one tagged correctly.

The final question ("how brave are you feeling?") shifts the ranking toward or
away from grapes that are rare *within this cellar* — the threshold scales with
list size, so it means the same thing on a 40-bottle list as on a 200-bottle one.

## Deploying

`vite.config.js` sets `base: '/postman/'` for a GitHub Pages subfolder deploy.
Change it if the app is served from a root domain, or assets will 404.

## Known issues in the sheet

Worth fixing at the source — the app copes with all of these, but the data is
wrong either way:

- **Price Glass is empty on every row.** The "By the glass" filter therefore
  returns nothing, and the glass price column on the list is all dashes.
- **`Kilikanoon, 'Duke' Grenache` has a blank Category**, so it never appears.
  Any other row like it is logged to the console at startup.
- **Country contradicts Region** on a couple of rows — `Ata Rangi 'Potiki'` is
  marked South Africa with a Martinborough NZ region, and `Gen del Alma
  'Superlogico'` is marked Australia with a Mendoza ARG region.
- **The Sparkling block all carries `Coonawarra, SA`**, including Tasmanian
  producers (Holm Oak, 42 Degrees South) and Italian ones (Bellavista
  Franciacorta, marked Australia). Looks like a fill-down.
- **`Occam's Razer` vs `Occam's Razor`** — same producer, two spellings, so they
  sort apart.
- The fortified section has the **price in the Vintage column**.
- `Jerez, EPN` should be `ESP`.

## Still to do

- Confirm the street address and swap `heroImage` in `src/config/venue.js` for a
  photo of the actual room
- Replace `public/favicon.svg` with the venue mark
- Decide whether specials should stay driven off the `Featured` column or move to
  their own tab
