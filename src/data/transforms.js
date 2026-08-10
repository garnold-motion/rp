// src/data/transforms.js
//
// Turns the venue's working wine-list spreadsheet into clean objects.
//
// The sheet is a human document first and a data source second: it has blank
// spacer rows, section banners typed into whichever column was handy, blend
// continuation lines, and a fortified section where someone put the price in
// the vintage column. All of that is handled here so no component downstream
// has to know about it.
//
// Sheet columns:
//   Category · Variety · Name · Producer · Country · Region · Vintage
//   Price Bottle · Price Glass · Featured · Organic · Vegan · Cellar
//   Stock Quantity

import { resolveProfile } from './varietyProfiles.js';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const str = (val) => {
  const s = String(val ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return s === '' ? null : s;
};

const num = (val) => {
  if (val === undefined || val === null) return null;
  // Prices arrive as "$1,300.00" — strip everything but digits and the point.
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const bool = (val) => {
  const s = String(val ?? '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'y' || s === '1' || s === 'x';
};

/* ------------------------------------------------------------------ */
/* Category                                                            */
/* ------------------------------------------------------------------ */

// The venue's own section names are kept rather than flattened into generic
// categories — this is how the printed list is organised and how the staff
// talk about it, so it's what people expect to filter by.
const SECTION_MAP = {
  BUBBLES: 'Bubbles',
  WHITE: 'White',
  'ITALIAN WHITE': 'Italian White',
  ROSE: 'Rosé',
  'ROSÉ': 'Rosé',
  'CHILLED RED': 'Chilled Red',
  RED: 'Red',
  'ITALIAN REDS': 'Italian Red',
  'ITALIAN RED': 'Italian Red',
  FORTIFIED: 'Fortified & Sweet',
};

export const SECTION_ORDER = [
  'Bubbles',
  'White',
  'Italian White',
  'Rosé',
  'Chilled Red',
  'Red',
  'Italian Red',
  'Fortified & Sweet',
];

const toSection = (val) => SECTION_MAP[String(val ?? '').trim().toUpperCase()] ?? null;

/* ------------------------------------------------------------------ */
/* Country                                                             */
/* ------------------------------------------------------------------ */

// Hundreds of rows have an empty Country but a Region like "Tamar Valley, TAS".
// The suffix is a reliable way to recover it.
const REGION_SUFFIX_COUNTRY = {
  VIC: 'Australia', NSW: 'Australia', SA: 'Australia', WA: 'Australia',
  TAS: 'Australia', QLD: 'Australia', NT: 'Australia', ACT: 'Australia',
  AUS: 'Australia',
  NZ: 'New Zealand',
  FRA: 'France', FRANCE: 'France',
  ITA: 'Italy', ITALY: 'Italy',
  GER: 'Germany',
  ESP: 'Spain', SPN: 'Spain',
  ARG: 'Argentina',
  USA: 'USA',
  AU: 'Austria', AUT: 'Austria',
  PRT: 'Portugal',
  SA_ZA: 'South Africa',
};

function countryFromRegion(region) {
  if (!region) return null;
  // Region is "Clare Valley, SA" — sometimes with a stray full stop.
  const parts = region.split(',');
  if (parts.length < 2) return null;
  const suffix = parts[parts.length - 1].replace(/[.\s]/g, '').toUpperCase();
  return REGION_SUFFIX_COUNTRY[suffix] ?? null;
}

/* ------------------------------------------------------------------ */
/* Name parsing                                                        */
/* ------------------------------------------------------------------ */

// The Producer column is empty on every row; the producer is actually the text
// before the first comma in Name, and the grapes are often after a " - ".
//
//   "Louis Roederer, 'Collection 244' - Pinot Noir/Chardonnay/Meunier"
//    └ producer ──┘  └── cuvée ────┘   └──────── grapes ───────────┘
//
// Some names have no comma at all ("Barossa Bourne, Sparkling Shiraz" does,
// "Colomba Nero D'avola" doesn't), so every part is optional.
function parseName(raw) {
  if (!raw) return { producer: null, label: null, grapes: null };

  let working = raw;
  let grapes = null;

  const dashIndex = working.search(/\s[-–—]\s/);
  if (dashIndex !== -1) {
    grapes = str(working.slice(dashIndex + 3));
    working = working.slice(0, dashIndex);
  }

  const commaIndex = working.indexOf(',');
  if (commaIndex !== -1) {
    return {
      producer: str(working.slice(0, commaIndex)),
      label: str(working.slice(commaIndex + 1)),
      grapes,
    };
  }

  return { producer: null, label: str(working), grapes };
}

/* ------------------------------------------------------------------ */
/* Vintage                                                             */
/* ------------------------------------------------------------------ */

// In the fortified section someone typed the price into Vintage ("195", "51").
// Only accept NV / MV / a plausible four-digit year, so those get dropped
// rather than displayed as "Buller Wines 195".
function parseVintage(raw) {
  const s = str(raw);
  if (!s) return null;
  const upper = s.toUpperCase();
  if (upper === 'NV' || upper === 'MV') return upper;
  if (/^\d{4}$/.test(s)) {
    const year = Number(s);
    if (year >= 1900 && year <= 2035) return s;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Junk detection                                                      */
/* ------------------------------------------------------------------ */

// Banner rows: someone typed a heading into the Name or Vintage column with
// nothing else on the row. e.g. Name = "White", Vintage = "BAROLO".
const BANNER_WORDS = new Set([
  'white', 'red', 'rose', 'rosé', 'italian red', 'italian white',
  'dessert/ fortified', 'dessert / fortified', 'organic', 'vegan', 'cellar',
  'barolo', 'nebbiolo', 'valpolicella', 'montepulciano', 'whites/rose',
  'reds', 'shiraz and cabernet', 'bubbles',
]);

function isBannerRow(row) {
  const name = str(row.Name);
  const hasPrice = num(row['Price Bottle']) != null || num(row['Price Glass']) != null;
  if (hasPrice) return false;

  // A heading in Name with no section and no price.
  if (name && !toSection(row.Category) && BANNER_WORDS.has(name.toLowerCase())) return true;

  // A heading parked in the Vintage column, e.g. "BAROLO".
  const vintage = str(row.Vintage);
  if (!name && vintage && BANNER_WORDS.has(vintage.toLowerCase())) return true;

  return false;
}

// Continuation lines carry the grape list for the wine above them:
//   RED | | - Cabernet Sauvignon/Merlot/Petit Verdot | | France | Bordeaux, FRA
// They start with a dash and have no price.
function isContinuationRow(row) {
  const name = str(row.Name);
  if (!name) return false;
  if (num(row['Price Bottle']) != null) return false;
  return /^[-–—]/.test(name);
}

/* ------------------------------------------------------------------ */
/* Main transform                                                      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Clean schema                                                        */
/* ------------------------------------------------------------------ */

// Once the sheet has been migrated (see scripts/migrate_sheet.py) the data is
// already one-row-per-wine with no banners, duplicates or embedded producers.
// That path is a straight read — all the salvage logic below exists only for
// the original sheet, and can be deleted once the migration has landed.
const transformWinesClean = (rows) =>
  rows
    .filter((r) => str(r.Wine))
    .map((r, i) => {
      const priceBottle = num(r['Price Bottle']);
      const priceGlass = num(r['Price Glass']);
      const section = str(r.Section) ?? 'Red';
      const variety = str(r.Variety);
      const name = str(r.Wine);

      // Hand-written pairing tags beat anything derived from the grape.
      const sheetPairings = str(r['Pairing Tags'])
        ?.split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const profile = resolveProfile({
        variety,
        name: `${str(r.Producer) ?? ''} ${name}`,
        section,
        explicit: {
          body: num(r.Body),
          sweetness: num(r.Sweetness),
          acidity: num(r.Acidity),
          tannins: num(r.Tannins),
          pairings: sheetPairings?.length ? sheetPairings : undefined,
        },
      });

      return {
        id: str(r.ID) ?? `w${i}`,
        section,
        category: section,
        variety,
        name,
        fullName: [str(r.Producer), name].filter(Boolean).join(', '),
        producer: str(r.Producer),
        grape_variety: variety,
        country: str(r.Country),
        region: str(r.Region),
        vintage: str(r.Vintage),
        price_bottle: priceBottle,
        price_glass: priceGlass,
        effective_bottle_price: priceBottle ?? (priceGlass ? priceGlass * 4 : null),
        featured: bool(r.Featured),
        organic: bool(r.Organic),
        vegan: bool(r.Vegan),
        biodynamic: bool(r.Biodynamic),
        cellar: bool(r['Cellar List']),
        stock: num(r['Stock Qty']),
        body: profile.body,
        sweetness: profile.sweetness,
        acidity: profile.acidity,
        tannins: profile.tannins,
        pairing_tags: profile.pairings,
        estimatedProfile: profile.estimated,
        description: str(r.short_desc),
        tasting_notes: str(r.long_desc),
        image_url: str(r['Image URL']),
        available: bool(r.Available, true),
      };
    })
    .filter((w) => w.available && (w.price_bottle != null || w.price_glass != null));

/* ------------------------------------------------------------------ */
/* Original schema                                                     */
/* ------------------------------------------------------------------ */

const transformWinesLegacy = (rows) => {
  const wines = [];
  // Rows that look like real wines but got dropped. Reported at the end rather
  // than vanishing silently — a blank Category cell is easy to miss in a sheet
  // this size, and the wine simply never appears in the app.
  const skipped = [];

  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;

    const rawName = str(row.Name);

    // Continuation line — attach its grapes to the wine we just built, and
    // recompute that wine's profile now we know what it's made of. Without the
    // second step a Bordeaux blend keeps the generic "Red" profile even though
    // the very next row tells us it's Cabernet-dominant.
    if (isContinuationRow(row)) {
      const previous = wines[wines.length - 1];
      if (previous && !previous.grape_variety) {
        const grapes = str(rawName.replace(/^[-–—]\s*/, ''));
        previous.grape_variety = grapes;

        if (previous.estimatedProfile) {
          const revised = resolveProfile({
            variety: grapes,
            name: `${previous.fullName} ${grapes}`,
            section: previous.section,
          });
          previous.body = revised.body;
          previous.sweetness = revised.sweetness;
          previous.acidity = revised.acidity;
          previous.tannins = revised.tannins;
          previous.pairing_tags = revised.pairings;
        }
      }
      return;
    }

    if (!rawName) return;
    if (isBannerRow(row)) return;

    const priceBottle = num(row['Price Bottle']);
    const priceGlass = num(row['Price Glass']);

    const section = toSection(row.Category);
    if (!section) {
      // A priced, named row with no recognised Category is a data-entry slip,
      // not a banner — flag it rather than dropping it quietly.
      if (priceBottle != null || priceGlass != null) {
        skipped.push({ name: rawName, category: str(row.Category) });
      }
      return;
    }

    // A row with a name but no price at all is almost always a leftover
    // heading or an in-progress entry, not something we can serve.
    if (priceBottle == null && priceGlass == null) return;

    const { producer, label, grapes } = parseName(rawName);
    const region = str(row.Region);
    const variety = str(row.Variety);

    const profile = resolveProfile({
      variety,
      name: rawName,
      section,
      explicit: {
        body: num(row.body),
        sweetness: num(row.sweetness),
        acidity: num(row.acidity),
        tannins: num(row.tannins),
      },
    });

    wines.push({
      section,
      // `category` is kept as an alias so the matcher's tannin rules and the
      // colour accents keep working off a single field.
      category: section,
      variety,
      name: label ?? rawName,
      fullName: rawName,
      producer: str(row.Producer) ?? producer,
      grape_variety: variety ?? grapes,
      country: str(row.Country) ?? countryFromRegion(region),
      region,
      vintage: parseVintage(row.Vintage),
      price_bottle: priceBottle,
      price_glass: priceGlass,
      effective_bottle_price: priceBottle ?? (priceGlass ? priceGlass * 4 : null),
      featured: bool(row.Featured),
      organic: bool(row.Organic),
      vegan: bool(row.Vegan),
      cellar: bool(row.Cellar),
      stock: num(row['Stock Quantity']),
      body: profile.body,
      sweetness: profile.sweetness,
      acidity: profile.acidity,
      tannins: profile.tannins,
      pairing_tags: profile.pairings,
      estimatedProfile: profile.estimated,
      description: null,
      tasting_notes: null,
      image_url: null,
      available: true,
    });
  });

  if (skipped.length > 0) {
    console.warn(
      `transformWines: ${skipped.length} priced row(s) skipped because the Category cell was blank or unrecognised — these wines will not appear in the app:`,
      skipped
    );
  }

  return dedupe(wines);
};

/**
 * Read either shape of the sheet. Detected by column name rather than
 * configured, so the app keeps working throughout the migration and there's no
 * moment where the sheet and the code have to be swapped in lockstep.
 */
export const transformWines = (rows) => {
  const first = rows.find((r) => r && typeof r === 'object');
  const isClean = first && ('Section' in first || 'Wine' in first);
  return isClean ? transformWinesClean(rows) : transformWinesLegacy(rows);
};

/* ------------------------------------------------------------------ */
/* Dedupe                                                              */
/* ------------------------------------------------------------------ */

// The sheet flags organic, vegan and cellar wines by *repeating* the wine in a
// trailing section with that column set to TRUE, rather than ticking a box on
// the original row. So the same bottle can appear three times.
//
// Collapse on producer + name + vintage, keeping the first (main-list) entry
// and OR-ing the flags in from every duplicate. Genuine back vintages in the
// cellar list have a different vintage, so they survive as their own entries.
function dedupe(wines) {
  const byKey = new Map();

  wines.forEach((wine) => {
    const key = [
      wine.producer ?? '',
      wine.name ?? '',
      wine.vintage ?? '',
    ]
      .join('|')
      .toLowerCase()
      .replace(/[^a-z0-9|]/g, '');

    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { ...wine, id: '' });
      return;
    }

    // Organic and vegan are properties of the wine, so OR them in from
    // whichever duplicate row happened to carry the tick.
    existing.organic = existing.organic || wine.organic;
    existing.vegan = existing.vegan || wine.vegan;
    existing.featured = existing.featured || wine.featured;

    // `cellar` is deliberately NOT OR-ed. It describes which part of the list a
    // bottle sits in, and several wines appear in both the main list and the
    // cellar section (Rockford Basket Press '19, Hill of Grace '21). OR-ing it
    // would mark those as cellar-only and hide them from the list of what's
    // actually pouring. First row wins, and the main list comes first.
    // Prefer whichever row actually carried a variety or a country.
    existing.grape_variety = existing.grape_variety ?? wine.grape_variety;
    existing.country = existing.country ?? wine.country;
    existing.price_glass = existing.price_glass ?? wine.price_glass;
  });

  // Assign ids only after collapsing, so they're stable and unique.
  return Array.from(byKey.values()).map((wine, i) => ({
    ...wine,
    id: `w${i}-${(wine.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
  }));
}

/* ------------------------------------------------------------------ */
/* Specials                                                            */
/* ------------------------------------------------------------------ */

// Until a dedicated specials tab exists, the board is driven off the
// `Featured` column on the main list.
export const transformSpecials = (rows) =>
  transformWines(rows)
    .filter((w) => w.featured)
    .map((w) => ({
      id: w.id,
      title: w.name,
      wine_name: w.fullName,
      producer: w.producer,
      vintage: w.vintage,
      region: w.region,
      country: w.country,
      category: w.section,
      label: 'Weekly Pick',
      description: null,
      tasting_notes: null,
      price_glass: w.price_glass,
      price_bottle: w.price_bottle,
      image_url: null,
      active: true,
    }));
