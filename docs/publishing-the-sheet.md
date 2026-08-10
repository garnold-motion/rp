# Getting the sheet live

Taking `RP Wine List.xlsx` and turning it into the published master the app reads.

---

## 1. Upload and convert

The file must become a **native Google Sheet**, not an Excel file sitting in
Drive. An uploaded `.xlsx` can't be published to the web, and none of the
validation or formatting works properly until it's converted.

1. Drag `RP Wine List.xlsx` into the Drive folder.
2. Right-click it → **Open with → Google Sheets**.
3. In the sheet that opens: **File → Save as Google Sheets**.
4. Delete the leftover `.xlsx` so there's only one file and no ambiguity about
   which one is the master.
5. Rename it something unmistakable — `RP WINE LIST — MASTER`.

*(If you convert uploads by default in Drive settings, steps 2–4 happen
automatically.)*

---

## 2. Tidy what didn't survive the conversion

Three things need a hand afterwards.

**Turn the flag columns into tick boxes.** They import as the words TRUE and
FALSE, which are horrible to edit. Select **K2:P** (Available → Featured) →
**Insert → Tick box**. The existing values convert in place.

**Hide the `_Lists` tab.** Right-click it → **Hide sheet**. It only exists to
feed the dropdowns.

**Check the dropdowns came across.** Click a cell in `Section` — you should get
a list of the eight sections. If not: select **E2:E**, then **Data → Data
validation → Add rule → Dropdown (from a range)** → `_Lists!$A$2:$A$9`, and set
*If the data is invalid → Reject the input*. Repeat for `Country` (G, from
`_Lists!$B$2:$B$13`) and `Variety` (F, from `_Lists!$C$2:$C$75`, warning only).

Then **protect the header row**: select row 1 → **Data → Protect sheets and
ranges**. The app matches columns by header *name*, so a renamed header breaks
it silently. Column order doesn't matter, names do.

---

## 3. Publish to web

**File → Share → Publish to web.**

- Under the first dropdown pick **Wine List** — the specific tab, not "Entire
  document".
- Under the second pick **Comma-separated values (.csv)**.
- Press **Publish**, confirm, and copy the URL.
- Leave **"Automatically republish when changes are made"** ticked.

### Grab the gid while you're there

The published URL ends in something like `...&gid=0&single=true&output=csv`.
Copy that `gid` number into `APP_LINK_GID` in `src/config/sheets.js`.

Without a gid the app reads whichever tab happens to be *first* in the document.
That works today, but the day someone drags a tab to the front, the app quietly
starts serving the wrong data. Pinning the gid removes that failure mode.

---

## 4. Point the app at it

In `src/config/sheets.js`, replace `PUBLISHED_BASE` with everything in the
published URL up to `/pub`, and set `APP_LINK_GID` to the number you copied.

The two cache keys in that file (`postman_wines_v2`) are worth bumping to `_v3`
when you switch over — that forces every phone that's already loaded the old
data to fetch fresh rather than serve a stale cache.

---

## Things worth knowing before you press Publish

**Publishing makes the tab genuinely public.** Anyone with the link can read
every row, including the `Notes` column. Don't put supplier costs, margins or
staff comments in `Notes` — or move `Notes` to a separate, unpublished tab keyed
on `ID`. Wine names and prices are on the menu anyway, so the rest is fine.

**Edits take up to ~15 minutes to show.** Google caches the published CSV for
around five minutes, and the app caches for ten in the browser. Not a bug — but
if the owner changes a price and refreshes immediately, nothing happens, and
they'll assume it's broken. Worth telling them up front.

**Don't delete and re-create the tab.** The gid changes and the app breaks.
Renaming the tab is fine; deleting it is not.

**Adding columns is safe. Renaming them isn't.** The parser looks columns up by
header name, so you can insert, reorder or add columns freely. Change a header's
spelling and that field silently goes blank.

---

## Who should own it

Worth deciding now rather than discovering it later.

**The venue's Google account should own the file**, with you as an Editor. If it
lives in your account, the client's entire wine list is hostage to your
Google login — a bad look, and a genuine problem if the relationship ever ends.

The tradeoff is that someone at the venue can un-publish it or drag a tab around
and take the app down without realising. Two cheap mitigations: keep your own
Editor access so you can fix it, and take a copy of the sheet occasionally as a
rollback.

---

## Once it's live

1. Open the published CSV URL in a browser — you should see raw comma-separated
   text starting with `ID,Producer,Wine,…`. If you see HTML, it published as a
   web page rather than CSV.
2. Run the app and check the Cellar tab fills.
3. Change one price in the sheet, wait fifteen minutes, hard-refresh the app,
   and confirm it moved. Do this once so you know the pipeline works end to end.
4. **Retire `data/tasting-notes.json`.** From here the sheet is the source of
   truth, and re-running the migration months from now would overwrite whatever
   the owner has added. Keep the file as a record, but don't run the script
   against the live sheet.
