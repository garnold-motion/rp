# Managing the wine list: options

A decision brief on how The Running Postman should maintain their wine data, and
whether there's a productisable module in it for the studio.

---

## 1. There are two different jobs here, and they need different answers

The phrase "stock take" is covering two jobs that look similar and aren't:

| | **List management** | **Stocktake** |
|---|---|---|
| Question it answers | *What's on our list, and what does it cost?* | *How many bottles do we physically have?* |
| Who does it | Owner | Floor staff |
| How often | Whenever a wine comes or goes | Weekly / monthly |
| Where | Desk, laptop | Cellar, on a phone, one hand full |
| Feeds | The guest app | Ordering, valuation, insurance |

The pain described — *"hard to organise by column and add wines"* — is **list
management**. The `Stock Quantity` column is empty on every row, so stocktake
isn't happening at all yet.

This matters because the two jobs want opposite interfaces. List management wants
a wide editable grid with good search. Stocktake wants a big-button, one-thumb,
works-in-a-cold-cellar counter. Any tool that tries to be both at once is usually
bad at both.

**Recommendation: solve list management first.** It's the active pain, it's what
the guest app depends on, and it's the prerequisite for stocktake being
meaningful.

---

## 2. The real problem is the schema, not the tool

Worth being blunt: a nicer interface on top of the current sheet would just make
the mess prettier. Building the app parser surfaced these, all of them structural:

- **Blank Category = invisible wine.** `Kilikanoon, 'Duke' Grenache` has an empty
  Category cell, so it silently never appears anywhere. Nobody would ever notice.
- **Organic / Vegan / Cellar are marked by duplicating the wine** in a trailing
  section rather than ticking a column. Cullen 'Kevin John' is in the sheet three
  times. The app has to detect and merge these.
- **`Price Glass` is empty on all ~1000 rows**, so the by-the-glass filter — one
  of the most useful things a guest can ask for — returns nothing.
- **Price is in the Vintage column** throughout the fortified section.
- **Fill-down errors**: the entire Sparkling block says `Coonawarra, SA`,
  including Tasmanian producers and two Italian Franciacortas marked Australia.
- **Producer isn't its own field** — it's the text before the first comma in
  `Name`, so you can't sort or group by producer.
- **Spacer rows and section banners** typed into whatever column was handy, which
  is why it can't be sorted or filtered as a table.
- `Occam's Razer` / `Occam's Razor` — same producer, two spellings, sorts apart.

None of this is a criticism of the owner; it's what every spreadsheet becomes
when it grows organically for years. But it means **step one is restructuring,
whatever we build next.** One row per wine, one column per attribute, no banners,
no duplicates, dropdowns on the columns that have a fixed set of answers.

That alone fixes most of the "hard to organise" complaint — a real table can be
sorted and filtered; the current sheet genuinely cannot.

---

## 3. How venues normally solve this

Four broad approaches, in rough order of cost.

### A. Disciplined Google Sheet — $0

Restructure into a proper table and add the features Sheets already has that
aren't being used: data validation dropdowns, protected header rows, filter
views, conditional formatting for missing data, and a **Google Form for adding a
wine** so the owner never scrolls to row 1,043 to type a new entry.

- **Cost:** nothing.
- **Effort:** about a day.
- **Good:** no new tool, no new login, no subscription, owner already knows it.
- **Bad:** still a spreadsheet. 1000 rows on a laptop is tolerable; on a phone in
  a cellar it's miserable. Protections get worked around.

### B. No-code app layer on the sheet — $5–$60/mo

[Google AppSheet](https://about.appsheet.com/pricing/) (from ~$5/user/mo, ~$10
for the useful tier) or [Glide](https://www.glideapps.com/) (Google Sheets sync
needs the ~$49/mo tier). Point them at the sheet, get a mobile app with forms and
offline support in a few days.

- **Good:** fast, Google-native (AppSheet), proper mobile app, someone else
  maintains it.
- **Bad:** subscription forever, generic look that won't match the guest app, and
  a low ceiling on customisation. Strategically it makes the studio an AppSheet
  configurator rather than a product company — no case study in it.

### C. Purpose-built beverage software — $50–$199/mo

[BinWise](https://home.binwise.com/wine-inventory-software) (~$199/mo, genuinely
wine-focused, POS integration, cellar management), [WISK](https://www.wisk.ai/)
(~$45–95/mo), Partender (~$50/mo plus ~$395 of scales).

- **Good:** real stocktake — variance, pour cost, reordering, POS sync. Solved
  problem, no build.
- **Bad:** ~$2,400/yr for BinWise is heavy for a neighbourhood wine bar, and
  **none of them will feed the guest app.** You'd end up maintaining the list in
  their system *and* exporting to a sheet for the app. Two sources of truth is
  worse than one messy one.

*(Figures are indicative from vendor and comparison pages, mid-2026 — confirm
before quoting any of them to a client.)*

### D. Custom admin app on the same sheet — $0/mo running cost

A second app in the same repo, same design language as the guest app, that reads
*and writes* the master sheet. The owner gets a real interface; the sheet stays
the source of truth, so nothing else has to change.

- **Good:** fits their actual workflow exactly, one data layer feeding both
  surfaces, no subscription, and it's a reusable module across every hospitality
  client.
- **Bad:** the studio maintains it. Write-back and auth are where the real work
  is (see §5).

---

## 4. Recommendation

**Phase it. Don't build the app first.**

**Phase 1 — restructure the sheet (this week, ~1 day, $0).**
One row per wine. Split `Producer` out of `Name`. Replace the duplicate
Organic/Vegan/Cellar sections with tick columns. Kill the spacer rows and
banners. Add dropdowns for Category, Variety and Country so the fill-down and
spelling errors stop happening. Fill in `Price Glass`.

Do this regardless of what comes next — it makes the app parser simpler and more
reliable, and it's most of the fix on its own. It's also the cheapest possible
thing to say yes to.

**Phase 2 — build "Cellar Manager" (2–3 weeks).**
Only once the data is clean. Details in §5.

**Phase 3 — productise (later).**
If it holds up across two or three venues, it becomes the standard second half of
every hospitality build: guest app + staff tool, one sheet.

A useful hedge: if the client won't commit to Phase 2, Phase 1 still leaves them
meaningfully better off, and AppSheet (option B) remains available as a cheap
stopgap without wasting any of the Phase 1 work.

---

## 5. What "Cellar Manager" would actually be

A separate route or build in the same repo, sharing the theme, the transform
layer and the variety profiles with the guest app.

### The screens that matter

1. **Search and edit** — type three letters, get the wine, edit price or
   availability inline. This is 80% of daily use.
2. **Add a wine** — dropdowns not free text for Category/Variety/Country, so bad
   data can't get in. Warn on likely duplicates before saving ("you already have
   a Moss Wood Cabernet 2021").
3. **86 / back on** — one tap to pull a wine off the guest list without deleting
   it. Currently there's no way to do this at all.
4. **Data health** — a standing list of what's broken: no price, no category,
   country contradicts region, possible duplicate. Turns cleanup into a
   finite, satisfying task instead of an invisible one.
5. **Stocktake mode** — big numbers, one thumb, works on a phone. Pick a section,
   count down the list, save. Phase 2b.
6. **Bulk price edit** — select a section, apply a percentage. Annual price rises
   currently mean editing hundreds of cells by hand.

### A design note on stocktake

Counting 1000 SKUs is a full day's work and won't happen regularly. Counting
should be prioritised by what actually needs it:

1. **The Cellar List first.** Back vintages are high-value and *irreplaceable* —
   you cannot reorder a 1994 Hill of Grace. Getting an accurate count of those is
   worth real money and matters for insurance.
2. **By-the-glass next.** Fast-moving, so the count drifts quickest.
3. **The main list rarely.** Slow-moving bottles, low variance.

Design for partial counts by section rather than an all-or-nothing session, or it
won't get used.

### Technical approach for writing back

The guest app reads a published CSV, which is read-only. To write:

**Recommended: a Google Apps Script web app as the write endpoint.** Runs as the
sheet owner, so permissions are already right. No server to run, no service
account key that could leak from a browser bundle, free.

The honest caveat: **auth is the fiddly part.** An Apps Script web app deployed
"anyone can access" is only protected by a shared secret in the client bundle,
which is weak. Options, roughly in order of effort:

- Shared secret in the client — low effort, low security. Probably acceptable
  given the stakes (worst case: someone edits a wine price), but shouldn't be
  presented as secure.
- Google sign-in on the client, allowlist the owner's email inside the script —
  proper, free, more fiddly with CORS.
- A small Cloudflare Worker holding the secret — clean, free tier, one more
  moving part.

Worth pricing Phase 2 with the middle option and being upfront that it's the bulk
of the "unglamorous" time.

**Alternative if it outgrows Sheets:** Supabase free tier gives a real database,
row-level security and proper auth. Right answer eventually for a multi-venue
product; wrong answer now, because it removes the thing the owner likes most —
that it's still their spreadsheet, and they can always open it and look.

---

## 6. The case study angle

This is a stronger story than the guest app alone, for three reasons.

**The before/after is unusually vivid.** A screenshot of the current sheet —
1000 rows, no table, wines listed three times, prices in the vintage column —
next to a clean app is an immediately legible transformation. Most agency case
studies can't show a problem that clearly.

**It demonstrates the architecture you're actually selling.** Two completely
different surfaces — a guest-facing experience and a staff tool — running off one
config-driven data layer. That's the argument for why a new venue is a config
swap rather than a rebuild, made concrete rather than asserted.

**There's a defensible cost line.** "Replaced a spreadsheet nobody could
maintain with a guest app and a staff tool, one source of truth, no monthly
software fee" reads well against ~$2,400/yr for dedicated wine software that
*still* wouldn't power the customer experience.

Angles worth capturing while building, since they're hard to reconstruct later:

- The messy sheet, screenshotted before restructuring. Do this **first** — it's
  gone the moment Phase 1 starts.
- A short clip of adding a wine: the old way (scroll to row 1,043) vs the new.
- The data-health screen finding real errors — concrete and credible.
- A number: how many wines were invisible, duplicated or mispriced before.

It also gives the studio a **second revenue line per client**: the guest app is
the build fee, the staff tool justifies the ongoing maintenance fee far better
than hosting alone does. That's a much easier retainer conversation.

---

## 7. Open questions for the client

- Do they want real stocktake (counts, variance, valuation), or just a better way
  to manage the list? Changes scope significantly.
- Is there a POS, and does it hold wine data too? If so, that's a third source of
  truth and worth knowing about now, not later.
- Who else besides the owner needs edit access? Determines how much the auth work
  matters.
- Is the cellar list insured on a stated value? If so, an accurate count has a
  hard financial justification and makes Phase 2b much easier to sell.

---

**Sources:** [BinWise](https://home.binwise.com/wine-inventory-software) ·
[WISK](https://www.wisk.ai/features/restaurant-bar-inventory-management-software) ·
[AppSheet pricing](https://about.appsheet.com/pricing/) ·
[Glide pricing](https://costbench.com/software/no-code/glide/) ·
[Airtable pricing](https://www.softr.io/blog/airtable-pricing) ·
[Baserow pricing](https://baserow.io/user-docs/pricing-plans) ·
[Apps Script service accounts](https://developers.google.com/apps-script/guides/service-account)
