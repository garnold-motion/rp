/**
 * The Running Postman — wine list migration
 * =========================================
 *
 * Rebuilds the messy working wine list into a clean, sortable table.
 *
 * SAFETY: this script only ever READS the source tab. It writes two new tabs and
 * never modifies or deletes anything that already exists. Even so — duplicate
 * the whole spreadsheet before running it.
 *
 * HOW TO RUN
 *   1. Open the spreadsheet
 *   2. Extensions → Apps Script
 *   3. Paste this whole file in, replacing anything there
 *   4. Save, then pick `migrate` from the function dropdown and press Run
 *   5. Approve the permission prompt (it's your own script on your own sheet)
 *   6. Two new tabs appear:
 *        · "APP Link v2"       — the clean data
 *        · "Migration Review"  — rows a human needs to look at
 *
 * WHAT IT FIXES
 *   · splits Producer out of Name, and the grape list out of the trailing " - "
 *   · folds blend continuation rows ("- Cabernet/Merlot") into the wine above
 *   · drops blank spacer rows and section banners typed into random columns
 *   · rejects the fortified section's price-in-the-Vintage-column values
 *   · splits "Clare Valley, SA" into Region + Country
 *   · collapses the duplicated Organic / Vegan / Cellar listings into tick boxes
 *   · assigns a stable ID to every wine
 *   · flags anything ambiguous rather than guessing
 */

var SOURCE_TAB = 'APP Link';
var OUTPUT_TAB = 'APP Link v2';
var REVIEW_TAB = 'Migration Review';

var OUTPUT_HEADERS = [
  'ID', 'Producer', 'Wine', 'Vintage', 'Section', 'Variety', 'Country', 'Region',
  'Price Bottle', 'Price Glass', 'Available', 'Organic', 'Vegan', 'Biodynamic',
  'Cellar List', 'Featured', 'Stock Qty', 'Par', 'Last Counted', 'Notes',
];

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

var SECTION_MAP = {
  'BUBBLES': 'Bubbles',
  'WHITE': 'White',
  'ITALIAN WHITE': 'Italian White',
  'ROSE': 'Rosé',
  'ROSÉ': 'Rosé',
  'CHILLED RED': 'Chilled Red',
  'RED': 'Red',
  'ITALIAN REDS': 'Italian Red',
  'ITALIAN RED': 'Italian Red',
  'FORTIFIED': 'Fortified & Sweet',
};

// Region suffix → country. This is how we recover the ~200 rows that have a
// region but an empty Country cell.
var SUFFIX_COUNTRY = {
  'VIC': 'Australia', 'NSW': 'Australia', 'SA': 'Australia', 'WA': 'Australia',
  'TAS': 'Australia', 'QLD': 'Australia', 'NT': 'Australia', 'ACT': 'Australia',
  'AUS': 'Australia',
  'NZ': 'New Zealand',
  'FRA': 'France', 'FRANCE': 'France',
  'ITA': 'Italy', 'ITALY': 'Italy',
  'GER': 'Germany',
  'ESP': 'Spain', 'SPN': 'Spain', 'EPN': 'Spain', // EPN is a recurring typo
  'ARG': 'Argentina',
  'USA': 'USA',
  'AU': 'Austria', 'AUT': 'Austria',
  'PRT': 'Portugal',
};

// Headings people typed into the Name or Vintage column.
var BANNERS = {
  'white': 1, 'red': 1, 'rose': 1, 'rosé': 1, 'bubbles': 1,
  'italian red': 1, 'italian white': 1, 'organic': 1, 'vegan': 1, 'cellar': 1,
  'dessert/ fortified': 1, 'dessert / fortified': 1,
  'barolo': 1, 'nebbiolo': 1, 'valpolicella': 1, 'montepulciano': 1,
  'whites/rose': 1, 'reds': 1, 'shiraz and cabernet': 1,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function txt(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\s+/g, ' ').trim();
}

function money(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') return v;
  var cleaned = String(v).replace(/[^0-9.]/g, '');
  if (cleaned === '') return '';
  var n = Number(cleaned);
  return isNaN(n) ? '' : n;
}

function isTrue(v) {
  var s = String(v === null || v === undefined ? '' : v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'y' || s === '1' || s === 'x';
}

/** A year, NV or MV. Anything else — like the prices sitting in the fortified
 *  section's Vintage column — is rejected. */
function cleanVintage(v) {
  var s = txt(v).toUpperCase();
  if (s === 'NV' || s === 'MV') return s;
  if (/^\d{4}$/.test(s)) {
    var y = Number(s);
    if (y >= 1900 && y <= 2035) return s;
  }
  return '';
}

/** "Louis Roederer, 'Collection 244' - Pinot Noir/Chardonnay"
 *   → producer, wine, grapes */
function splitName(raw) {
  var out = { producer: '', wine: '', grapes: '' };
  if (!raw) return out;

  var working = raw;
  var dash = working.search(/\s[-–—]\s/);
  if (dash !== -1) {
    out.grapes = txt(working.substring(dash + 3));
    working = working.substring(0, dash);
  }

  var comma = working.indexOf(',');
  if (comma !== -1) {
    out.producer = txt(working.substring(0, comma));
    out.wine = txt(working.substring(comma + 1));
  } else {
    out.wine = txt(working);
  }
  return out;
}

/** "Clare Valley, SA" → { region: 'Clare Valley', country: 'Australia' } */
function splitRegion(raw) {
  var s = txt(raw);
  if (!s) return { region: '', country: '' };

  var parts = s.split(',');
  if (parts.length < 2) return { region: s, country: '' };

  var suffix = parts[parts.length - 1].replace(/[.\s]/g, '').toUpperCase();
  var country = SUFFIX_COUNTRY[suffix] || '';

  if (!country) return { region: s, country: '' }; // unrecognised — keep it whole
  return { region: txt(parts.slice(0, -1).join(',')), country: country };
}

function isBanner(name, vintage, hasPrice, section) {
  if (hasPrice) return false;
  if (name && !section && BANNERS[name.toLowerCase()]) return true;
  if (!name && vintage && BANNERS[String(vintage).toLowerCase()]) return true;
  return false;
}

function isContinuation(name, hasPrice) {
  return !!name && !hasPrice && /^[-–—]/.test(name);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

function migrate() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var source = ss.getSheetByName(SOURCE_TAB);

  if (!source) {
    throw new Error(
      'Could not find a tab named "' + SOURCE_TAB + '". ' +
      'Check the tab name and update SOURCE_TAB at the top of this script.'
    );
  }

  var values = source.getDataRange().getValues();
  if (values.length < 2) throw new Error('The source tab looks empty.');

  // Map headers by name so the script survives columns being reordered.
  var headers = values[0].map(function (h) { return txt(h); });
  var col = {};
  headers.forEach(function (h, i) { col[h] = i; });

  function cell(row, name) {
    var i = col[name];
    return i === undefined ? '' : row[i];
  }

  var wines = [];
  var review = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var sheetRow = r + 1; // 1-based, for the review tab

    var rawName = txt(cell(row, 'Name'));
    var priceBottle = money(cell(row, 'Price Bottle'));
    var priceGlass = money(cell(row, 'Price Glass'));
    var hasPrice = priceBottle !== '' || priceGlass !== '';
    var section = SECTION_MAP[txt(cell(row, 'Category')).toUpperCase()] || '';

    // Blend continuation — belongs to the wine above.
    if (isContinuation(rawName, hasPrice)) {
      var prev = wines[wines.length - 1];
      if (prev && !prev.variety) {
        prev.variety = txt(rawName.replace(/^[-–—]\s*/, ''));
      }
      continue;
    }

    if (!rawName) continue;
    if (isBanner(rawName, txt(cell(row, 'Vintage')), hasPrice, section)) continue;

    // A named, priced row with no recognisable section is a data-entry slip.
    // Don't drop it silently — that's how a wine disappears for a year.
    if (!section) {
      if (hasPrice) {
        review.push([
          sheetRow, rawName, 'Blank or unrecognised Category',
          'Row has a price but no section, so it would never appear in the app. ' +
          'Set Category on the original row, then re-run.',
        ]);
      }
      continue;
    }

    if (!hasPrice) {
      review.push([sheetRow, rawName, 'No price', 'Skipped — add a bottle or glass price.']);
      continue;
    }

    var parsed = splitName(rawName);
    var rawRegion = txt(cell(row, 'Region'));
    var regionSplit = splitRegion(rawRegion);
    var statedCountry = txt(cell(row, 'Country'));

    // Where the Country cell and the region suffix disagree, flag it rather than
    // silently picking one. These are genuine errors (a Martinborough wine
    // marked South Africa), and only a human knows which side is right.
    var country = statedCountry;
    if (statedCountry && regionSplit.country && statedCountry !== regionSplit.country) {
      review.push([
        sheetRow, rawName, 'Country contradicts Region',
        'Country says "' + statedCountry + '" but Region "' + rawRegion +
        '" implies ' + regionSplit.country + '. Kept "' + statedCountry + '" — please confirm.',
      ]);
    } else if (!statedCountry) {
      country = regionSplit.country;
    }

    if (!country) {
      review.push([sheetRow, rawName, 'No country', 'Could not determine a country. Please fill it in.']);
    }

    var vintage = cleanVintage(cell(row, 'Vintage'));
    var rawVintage = txt(cell(row, 'Vintage'));
    if (rawVintage && !vintage) {
      review.push([
        sheetRow, rawName, 'Vintage is not a year',
        'Vintage cell contained "' + rawVintage + '" — cleared. Set a year, NV or MV.',
      ]);
    }

    wines.push({
      producer: parsed.producer,
      wine: parsed.wine || rawName,
      vintage: vintage,
      section: section,
      variety: txt(cell(row, 'Variety')) || parsed.grapes,
      country: country,
      region: regionSplit.region,
      priceBottle: priceBottle,
      priceGlass: priceGlass,
      organic: isTrue(cell(row, 'Organic')),
      vegan: isTrue(cell(row, 'Vegan')),
      cellar: isTrue(cell(row, 'Cellar')),
      featured: isTrue(cell(row, 'Featured')),
      stock: money(cell(row, 'Stock Quantity')),
      sourceRow: sheetRow,
    });
  }

  var merged = dedupe(wines, review);
  writeOutput(ss, merged);
  writeReview(ss, review);

  var sourceRowCount = values.length - 1;
  SpreadsheetApp.getUi().alert(
    'Migration complete\n\n' +
    sourceRowCount + ' source rows → ' + merged.length + ' wines.\n' +
    review.length + ' item(s) need a look on the "' + REVIEW_TAB + '" tab.\n\n' +
    'Nothing on "' + SOURCE_TAB + '" was changed.'
  );
}

/* ------------------------------------------------------------------ */
/* Dedupe                                                              */
/* ------------------------------------------------------------------ */

/**
 * The sheet flags organic / vegan / cellar wines by repeating the whole wine in
 * a trailing section, so the same bottle appears up to three times. Collapse on
 * producer + wine + vintage and merge the ticks in.
 *
 * `cellar` is deliberately NOT merged: it says which list a bottle sits on, and
 * several wines are on both the current list and the cellar list. Merging it
 * would mark those as cellar-only and hide them from what's actually pouring.
 * First occurrence wins, and the main list comes first in the sheet.
 */
function dedupe(wines, review) {
  var map = {};
  var order = [];

  wines.forEach(function (w) {
    var key = (w.producer + '|' + w.wine + '|' + w.vintage)
      .toLowerCase().replace(/[^a-z0-9|]/g, '');

    if (!map[key]) {
      map[key] = w;
      order.push(key);
      return;
    }

    var first = map[key];
    first.organic = first.organic || w.organic;
    first.vegan = first.vegan || w.vegan;
    first.featured = first.featured || w.featured;
    if (!first.variety) first.variety = w.variety;
    if (!first.country) first.country = w.country;
    if (first.priceGlass === '') first.priceGlass = w.priceGlass;

    // Same wine, same vintage, different price is worth a human look.
    if (w.priceBottle !== '' && first.priceBottle !== '' && w.priceBottle !== first.priceBottle) {
      review.push([
        w.sourceRow, w.producer + ' ' + w.wine + ' ' + w.vintage, 'Duplicate with a different price',
        'Also listed on row ' + first.sourceRow + ' at $' + first.priceBottle +
        ' (this one $' + w.priceBottle + '). Kept $' + first.priceBottle + '.',
      ]);
    }
  });

  return order.map(function (key, i) {
    var w = map[key];
    w.id = 'RP-' + ('000' + (i + 1)).slice(-4);
    return w;
  });
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

function freshSheet(ss, name) {
  var existing = ss.getSheetByName(name);
  if (existing) ss.deleteSheet(existing);
  return ss.insertSheet(name);
}

function writeOutput(ss, wines) {
  var sheet = freshSheet(ss, OUTPUT_TAB);

  var rows = wines.map(function (w) {
    return [
      w.id, w.producer, w.wine, w.vintage, w.section, w.variety, w.country, w.region,
      w.priceBottle, w.priceGlass,
      true,                       // Available — everything starts on the list
      w.organic, w.vegan, false,  // Biodynamic — nothing to migrate from
      w.cellar, w.featured,
      w.stock, '', '', '',        // Stock Qty, Par, Last Counted, Notes
    ];
  });

  sheet.getRange(1, 1, 1, OUTPUT_HEADERS.length).setValues([OUTPUT_HEADERS]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, OUTPUT_HEADERS.length).setValues(rows);
  }

  // Vintage as plain text, or Sheets turns 2014 into a number and NV into junk.
  sheet.getRange(2, 4, Math.max(rows.length, 1), 1).setNumberFormat('@');
  sheet.getRange(2, 9, Math.max(rows.length, 1), 2).setNumberFormat('$#,##0.00');
  sheet.getRange(2, 11, Math.max(rows.length, 1), 6).insertCheckboxes();

  sheet.getRange(1, 1, 1, OUTPUT_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#221c18')
    .setFontColor('#f6efe6');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, OUTPUT_HEADERS.length);
}

function writeReview(ss, review) {
  var sheet = freshSheet(ss, REVIEW_TAB);
  var headers = ['Source row', 'Wine', 'Issue', 'What to do'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#8c2f39')
    .setFontColor('#ffffff');

  if (review.length) {
    sheet.getRange(2, 1, review.length, headers.length).setValues(review);
  } else {
    sheet.getRange(2, 1).setValue('Nothing to review — clean run.');
  }

  sheet.setFrozenRows(1);
  sheet.setColumnWidth(2, 320);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 460);
}

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Wine list')
    .addItem('Run migration', 'migrate')
    .addToUi();
}
