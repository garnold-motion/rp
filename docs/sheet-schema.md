# The wine sheet: structure

> **This migration is done.** The live Google Sheet already uses this schema —
> what follows is the reference for what each column means and why, plus the
> steps that were taken to get there. Kept as documentation, and as the starting
> point for the next venue.

The schema the wine list uses, and why each decision was made.

Designed for **list management only** — stocktake columns are reserved but
optional, so that phase can be added later without another migration.

---

## The columns

| # | Column | Type | Required | Notes |
|---|---|---|---|---|
| A | `ID` | Text | auto | Stable key like `RP-0142`. Never reused, never edited. Needed so a future admin app can update the right row when a name or price changes. |
| B | `Producer` | Text (dropdown) | ✅ | Split out of `Name`. Its own column so you can sort and group by producer — currently impossible. |
| C | `Wine` | Text | ✅ | The cuvée or label only, without the producer. `'Collection 244'`, `Polish Hill Riesling`. |
| D | `Vintage` | Text | ✅ | A four-digit year, or `NV` / `MV`. **Format the column as plain text**, or Sheets turns `2014` into a number and `NV` into a mess. |
| E | `Section` | Dropdown | ✅ | The menu section. Renamed from `Category` because it isn't a wine category — it's where it sits on the list. |
| F | `Variety` | Dropdown | ✅ | Grape or style. Drives the app's sub-filter and its taste estimate, so consistency matters more than precision. |
| G | `Country` | Dropdown | ✅ | Its own field. No longer inferred from a region suffix. |
| H | `Region` | Dropdown | ✅ | **Without the state/country suffix.** `Clare Valley`, not `Clare Valley, SA`. The suffix was duplicating Country and was the source of the mismatches. |
| I | `Price Bottle` | Currency | ✅ | Plain number, currency-formatted. No `$` typed into the cell. |
| J | `Price Glass` | Currency | — | Blank means not available by the glass. **This is the "by the glass" flag** — don't add a separate tick column, it would only ever contradict this one. |
| K | `Available` | Checkbox | ✅ | Unticked hides the wine from the guest app. **This is new** — there is currently no way to 86 a wine short of deleting the row. |
| L | `Organic` | Checkbox | — | Replaces the duplicated Organic section. |
| M | `Vegan` | Checkbox | — | Replaces the duplicated Vegan section. |
| N | `Biodynamic` | Checkbox | — | Optional, but wine bars get asked. Cheap to add now, annoying to add later. |
| O | `Cellar List` | Checkbox | — | Back-vintage / rare list. Replaces the duplicated Cellar section. |
| P | `Featured` | Checkbox | — | Puts the wine on the specials board and the home page. |
| Q | `Body` | 1–10 | — | Feather-light → powerfully full. |
| R | `Sweetness` | 1–10 | — | Bone dry → lusciously sweet. |
| S | `Acidity` | 1–10 | — | Very low → racy. |
| T | `Tannins` | 1–10 | — | Silky → powerfully grippy. Only really matters for reds. |
| U | `Pairing Tags` | Text | — | Comma-separated: `just_drinking`, `cheese_charcuterie`, `seafood`, `hearty_meats`. |
| V | `short_desc` | Text | — | One line for the wine card. |
| W | `long_desc` | Text | — | Two or three sentences for the detail view. |
| X | `Notes` | Text | — | Internal only — never shown to guests. Importer contact, allocation notes, "last 3 bottles". |

### The tasting columns (Q–W)

These drive Find My Wine. A wine without them still appears on the list, but the
app has to estimate its profile from the grape variety, which is right often
enough to be useful and wrong at the margins — it can't tell a lean Shiraz from a
blockbuster one.

Filling them in is the single highest-value thing anyone can do to the sheet.
Start with the by-the-glass wines, since those get ordered most.

### No stock columns, deliberately

There's no `Stock Qty`, `Par` or `Last Counted` here. The venue already runs a
stocktake system, and a half-maintained set of quantity columns in this sheet
would only become a second, wrong answer to "how many have we got".

`Available` is the only stock-adjacent field, and it means one thing: whether the
wine shows in the app. Untick it when something runs out, tick it when it's back.

If stocktake is ever brought into this system, it should be its own tab keyed on
`ID` rather than more columns bolted onto this one.

### What's deliberately gone

- **`Name` as one blob.** Split into `Producer` + `Wine`.
- **The region suffix.** `Country` owns that now.
- **Duplicate rows for Organic / Vegan / Cellar.** Tick columns instead. Cullen
  'Kevin John' currently appears three times; after migration it appears once
  with two boxes ticked.
- **Spacer rows and section banners.** A table sorts and filters; a table with
  blank rows and headings typed into cells does not. This is the single biggest
  reason the sheet is hard to organise today.

---

## Dropdown lists

Put these on a separate `_Lists` tab (right-click → Hide sheet), then apply them
with **Data → Data validation → Dropdown from a range**, and set
**"If the data is invalid: Reject the input"** — not "Show a warning". A warning
gets clicked through; a rejection stops the typo entering the data.

### `Section` (8)

```
Bubbles
White
Italian White
Rosé
Chilled Red
Red
Italian Red
Fortified & Sweet
```

### `Country` (12)

```
Australia
New Zealand
France
Italy
Spain
Germany
Austria
Portugal
Argentina
USA
South Africa
Chile
```

### `Variety`

Seed from what's already in the sheet, tidied. Roughly:

```
Champagne · Sparkling · Sparkling Rosé · Sparkling Red · Prosecco
Riesling · Sauvignon Blanc · Semillon · Pinot Gris · Pinot Grigio · Pinot Blanc
Chardonnay · Chablis · Chenin Blanc · Grüner Veltliner · Fiano · Vermentino
Albariño · Verdejo · Marsanne · Roussanne · Viognier · Gewürztraminer
Soave · Lugana · Friulano · Falanghina · Greco · Gavi · Vernaccia · Grillo
Moscato · Skin Contact · White Blend
Rosé
Pinot Noir · Gamay · Grenache · Sangiovese · Tempranillo · Shiraz · Syrah
Cabernet Sauvignon · Cabernet Franc · Merlot · Malbec · Nebbiolo · Barolo
Barbaresco · Barbera · Dolcetto · Valpolicella · Amarone · Montepulciano
Primitivo · Negroamaro · Nero d'Avola · Cannonau · Carignano · Aglianico
Sagrantino · Nerello Mascalese · Frappato · Durif · Red Blend
Tawny · Port · Sherry · Vin Santo · Sauternes · Botrytis · Recioto
```

Keep this list short and fight the urge to add a variant for every wine. Every
new entry is a future inconsistency — `Shiraz` and `Shiraz / Syrah` as separate
options is exactly how the current mess started.

### `Producer`

Also worth a dropdown, seeded from existing producers. It's what stops
`Occam's Razer` / `Occam's Razor` and Henschke appearing three ways. Set this one
to **"Show a warning"** rather than reject, so a genuinely new producer can still
be added — then tidied into the list later.

---

## Sheet setup, in order

1. **Duplicate the whole spreadsheet first.** File → Make a copy, name it
   `Wine List — ARCHIVE (pre-migration)`. Non-negotiable.
2. Run the migration script (`scripts/migrate_sheet.py`). It writes new tabs and
   never touches the original.
3. Check the `Migration Review` tab and resolve anything on it.
4. Rename the clean tab to `APP Link` once you're happy, and move it to first
   position (the app reads the first published tab).
5. **Convert to a table**: select the data → Format → Convert to table. This
   gives durable column types, per-column filters and sort, and stops the blank
   rows creeping back.
6. Freeze row 1.
7. Apply the dropdowns from `_Lists`.
8. Format `Vintage` as plain text, `Price Bottle` / `Price Glass` as currency.
9. Protect row 1 (Data → Protect sheets and ranges) so the headers can't be
   renamed — the app matches on header names.
10. Add the conditional formatting below.

---

## Conditional formatting for data health

These turn invisible problems into visible ones. Format → Conditional formatting
→ Custom formula, applied to `A2:T`.

**Missing a price** — the wine can't be sold:

```
=AND($C2<>"", $I2="", $J2="")
```

**Missing section, variety or country** — the wine will be hard to find in the app:

```
=AND($C2<>"", OR($E2="", $F2="", $G2=""))
```

**Possible duplicate** — same producer, wine and vintage already exists:

```
=AND($C2<>"", COUNTIFS($B:$B,$B2, $C:$C,$C2, $D:$D,$D2)>1)
```

**Has real tasting data** — so you can see coverage at a glance:

```
=AND($C2<>"", $Q2<>"")
```

Amber for the first two, red for the duplicate, green for the last.

---

## Adding a wine without scrolling

The 1,000-row scroll is the daily irritation, and it has a free fix: a **Google
Form** bound to the sheet (Tools → Create a new form). Dropdown questions for
Section, Variety and Country; short answer for the rest. Bookmark it on the
owner's phone.

New wines land as a clean, validated row without ever opening the grid. Note that
Forms append to their own linked tab, so either point the app at a query that
unions both, or make it a habit to move rows across weekly — worth deciding
before setting it up.

---

## Optional: a `Variety Profiles` tab

The app currently estimates each wine's body / sweetness / acidity / tannins from
its grape variety, using a table baked into the code.

That table could live on its own tab instead — about 60 rows, one per variety,
with four 1–10 columns. The owner or a sommelier could then tune the whole list's
taste data by editing 60 rows rather than 1,000, and the app would pick it up
without a code change.

Worth doing only if they actually want to tune it. Otherwise the built-in
defaults are fine and this is a tab nobody maintains.
