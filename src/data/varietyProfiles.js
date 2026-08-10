// src/data/varietyProfiles.js
//
// The wine list has no taste columns — no body, sweetness, acidity or tannin
// ratings — so Find My Wine has nothing of its own to match on. Rather than
// ask the venue to hand-score 700 wines, we derive an approximate profile from
// the grape variety, which is the single strongest predictor of style.
//
// These are textbook-typical values for each variety, on a 1–10 scale. They
// will be wrong at the margins (a lean Barossa Shiraz, an oaked Riesling), but
// they're right often enough to make the recommender useful, and any wine can
// be corrected later by adding explicit columns to the sheet — `resolveProfile`
// always prefers real data when it's present.
//
//   body      1 feather-light   → 10 powerfully full
//   sweetness 1 bone dry        → 10 lusciously sweet
//   acidity   1 very low        → 10 racy
//   tannins   1 silky           → 10 powerfully grippy

const P = (body, sweetness, acidity, tannins, pairings = []) => ({
  body,
  sweetness,
  acidity,
  tannins,
  pairings,
});

const SEA = 'seafood';
const BOARD = 'cheese_charcuterie';
const MEAT = 'hearty_meats';
const SOLO = 'just_drinking';

// Keys are lower-cased. Lookup is exact-match first, then substring, so
// "Pinot Grigio / Pinot Gris" and "Sparkling Rose" both resolve.
export const VARIETY_PROFILES = {
  /* ---------------- Sparkling ---------------- */
  champagne: P(4, 2, 8, 2, [SEA, SOLO]),
  'blanc de blancs': P(3, 2, 9, 2, [SEA, SOLO]),
  sparkling: P(4, 3, 8, 2, [SEA, SOLO]),
  prosecco: P(3, 4, 7, 1, [SOLO]),
  'sparkling rose': P(4, 3, 8, 2, [SOLO, SEA]),
  'sparkling red': P(7, 5, 5, 5, [MEAT]),
  'sparking shiraz': P(8, 5, 5, 6, [MEAT]),
  brut: P(4, 2, 8, 2, [SEA, SOLO]),
  'pet nat': P(4, 3, 8, 2, [SOLO]),

  /* ---------------- White ---------------- */
  riesling: P(3, 2, 9, 1, [SEA, SOLO]),
  'sauvignon blanc': P(3, 2, 8, 1, [SEA, SOLO]),
  'sancerre blanc': P(4, 1, 8, 1, [SEA]),
  sancerre: P(4, 1, 8, 1, [SEA]),
  semillon: P(4, 2, 8, 1, [SEA]),
  'pinot grigio': P(3, 2, 7, 1, [SEA, SOLO]),
  'pinot gris': P(4, 3, 6, 1, [SEA, SOLO]),
  'pinot blanc': P(4, 2, 6, 1, [SEA, SOLO]),
  'pinot bianco': P(4, 2, 6, 1, [SEA, SOLO]),
  chardonnay: P(6, 2, 6, 1, [SEA, BOARD]),
  chablis: P(5, 1, 8, 1, [SEA]),
  burgundy: P(6, 2, 7, 1, [SEA, BOARD]),
  'chenin blanc': P(5, 3, 8, 1, [SEA, SOLO]),
  vouvray: P(5, 4, 8, 1, [SOLO, SEA]),
  'gruner veltliner': P(4, 2, 8, 1, [SEA, SOLO]),
  fiano: P(5, 2, 6, 1, [SEA, BOARD]),
  vermentino: P(4, 2, 7, 1, [SEA]),
  albarino: P(4, 2, 8, 1, [SEA]),
  arinto: P(4, 2, 8, 1, [SEA]),
  verdejo: P(4, 2, 7, 1, [SEA]),
  torrontes: P(4, 3, 6, 1, [SOLO]),
  marsanne: P(6, 2, 5, 1, [BOARD]),
  roussanne: P(6, 2, 5, 1, [BOARD]),
  viognier: P(6, 3, 4, 1, [BOARD]),
  gewurztraminer: P(6, 5, 4, 1, [SOLO]),
  soave: P(4, 2, 6, 1, [SEA]),
  lugana: P(4, 2, 6, 1, [SEA]),
  friulano: P(5, 2, 6, 1, [SEA, BOARD]),
  fruilano: P(5, 2, 6, 1, [SEA, BOARD]), // sheet spelling
  falanghina: P(4, 2, 7, 1, [SEA]),
  greco: P(5, 2, 7, 1, [SEA]),
  gavi: P(4, 2, 7, 1, [SEA]),
  cortese: P(4, 2, 7, 1, [SEA]),
  vernaccia: P(4, 2, 6, 1, [SEA]),
  grillo: P(4, 2, 6, 1, [SEA]),
  'petite arvine': P(5, 2, 7, 1, [SEA]),
  'ribolla gialla': P(5, 2, 6, 3, [BOARD]),
  savagnin: P(5, 2, 7, 1, [BOARD]),
  'skin contact': P(6, 2, 6, 5, [BOARD]),
  'orange wine': P(6, 2, 6, 5, [BOARD]),

  /* ---------------- Sweet / off-dry ---------------- */
  moscato: P(3, 8, 5, 1, [SOLO]),
  frontignac: P(4, 8, 5, 1, [SOLO]),
  brachetto: P(4, 7, 5, 1, [SOLO]),
  'something sweeter': P(4, 8, 5, 1, [SOLO]),
  sweet: P(7, 9, 6, 1, [SOLO]),
  sauternes: P(7, 9, 6, 1, [SOLO]),
  botrytis: P(7, 9, 6, 1, [SOLO]),
  vinsanto: P(7, 9, 5, 2, [SOLO]),
  'vin santo': P(7, 9, 5, 2, [SOLO]),
  recioto: P(8, 8, 5, 4, [SOLO]),

  /* ---------------- Fortified ---------------- */
  tawny: P(8, 7, 4, 3, [SOLO]),
  tokay: P(8, 8, 5, 2, [SOLO]),
  port: P(9, 8, 4, 5, [SOLO]),
  sherry: P(6, 2, 6, 2, [BOARD, SOLO]),
  'fino sherry': P(4, 1, 7, 1, [SEA, BOARD]),
  fino: P(4, 1, 7, 1, [SEA, BOARD]),
  manzanilla: P(4, 1, 7, 1, [SEA, BOARD]),
  oloroso: P(8, 3, 5, 3, [BOARD]),
  chinato: P(7, 7, 5, 4, [SOLO]),

  /* ---------------- Rosé ---------------- */
  rose: P(3, 2, 7, 1, [SEA, SOLO]),
  'dry rose': P(3, 2, 7, 1, [SEA, SOLO]),
  'pinot noir rose': P(3, 2, 7, 2, [SEA, SOLO]),

  /* ---------------- Red ---------------- */
  'pinot noir': P(4, 1, 7, 4, [SEA, BOARD]),
  'pinot nero': P(4, 1, 7, 4, [SEA, BOARD]),
  spatburgunder: P(4, 1, 7, 4, [SEA, BOARD]),
  gamay: P(3, 1, 8, 3, [BOARD, SOLO]),
  beaujolais: P(3, 1, 8, 3, [BOARD, SOLO]),
  grenache: P(5, 2, 5, 4, [BOARD, MEAT]),
  'chilled grenache': P(4, 2, 6, 3, [BOARD, SOLO]),
  sangiovese: P(6, 1, 8, 6, [MEAT, BOARD]),
  chianti: P(6, 1, 8, 6, [MEAT, BOARD]),
  brunello: P(8, 1, 8, 8, [MEAT]),
  tempranillo: P(6, 2, 6, 6, [MEAT, BOARD]),
  'shiraz / syrah': P(8, 2, 5, 7, [MEAT]),
  shiraz: P(8, 2, 5, 7, [MEAT]),
  syrah: P(7, 2, 6, 7, [MEAT]),
  'cabernet sauvignon': P(8, 1, 6, 8, [MEAT]),
  'cabernet blends': P(8, 1, 6, 7, [MEAT]),
  'cabernet franc': P(6, 1, 7, 6, [MEAT, BOARD]),
  cabernet: P(8, 1, 6, 8, [MEAT]),
  merlot: P(6, 2, 5, 5, [MEAT, BOARD]),
  malbec: P(8, 2, 5, 6, [MEAT]),
  bordeaux: P(8, 1, 6, 8, [MEAT]),
  nebbiolo: P(7, 1, 8, 8, [MEAT]),
  barolo: P(9, 1, 8, 9, [MEAT]),
  barbaresco: P(8, 1, 8, 8, [MEAT]),
  barbera: P(6, 1, 8, 4, [MEAT, BOARD]),
  dolcetto: P(5, 1, 6, 5, [BOARD]),
  valpolicella: P(6, 2, 7, 5, [MEAT, BOARD]),
  amarone: P(10, 4, 6, 7, [MEAT]),
  montepulciano: P(7, 2, 6, 6, [MEAT]),
  primitivo: P(8, 3, 5, 6, [MEAT]),
  'primitive and negroamaro': P(8, 3, 5, 6, [MEAT]),
  negroamaro: P(7, 2, 6, 6, [MEAT]),
  "nero d'avola": P(7, 2, 6, 6, [MEAT]),
  cannonau: P(7, 2, 6, 6, [MEAT]),
  'cannonau and carignano': P(7, 2, 6, 6, [MEAT]),
  carignano: P(7, 2, 6, 6, [MEAT]),
  aglianico: P(8, 1, 8, 8, [MEAT]),
  sagrantino: P(9, 1, 7, 9, [MEAT]),
  'nerello mascalese': P(5, 1, 7, 5, [BOARD, MEAT]),
  'etna rosso': P(5, 1, 7, 5, [BOARD, MEAT]),
  frappato: P(3, 1, 7, 3, [BOARD, SOLO]),
  bolgheri: P(8, 1, 6, 8, [MEAT]),
  saperavi: P(8, 2, 6, 7, [MEAT]),
  durif: P(9, 2, 5, 8, [MEAT]),
  graciano: P(7, 2, 6, 6, [MEAT]),
  refosco: P(7, 1, 7, 6, [MEAT]),
  marzemino: P(5, 2, 6, 4, [BOARD]),
  'pinot meunier': P(4, 1, 7, 4, [BOARD]),
  mencia: P(5, 1, 7, 4, [BOARD, MEAT]),
  'red blends': P(7, 2, 6, 6, [MEAT]),
  'other varities': P(7, 2, 6, 6, [MEAT]), // sheet spelling
};

// Fallbacks when the variety is blank or unrecognised, keyed on the venue's
// own menu section.
export const SECTION_PROFILES = {
  Bubbles: P(4, 3, 8, 2, [SEA, SOLO]),
  White: P(5, 2, 7, 1, [SEA, SOLO]),
  'Italian White': P(5, 2, 7, 1, [SEA, SOLO]),
  Rosé: P(3, 2, 7, 1, [SEA, SOLO]),
  'Chilled Red': P(4, 2, 7, 3, [BOARD, SOLO]),
  Red: P(7, 2, 6, 6, [MEAT, BOARD]),
  'Italian Red': P(7, 2, 7, 7, [MEAT, BOARD]),
  'Fortified & Sweet': P(8, 8, 5, 3, [SOLO]),
};

const normalise = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[éè]/g, 'e')
    .replace(/[àá]/g, 'a')
    .replace(/[üú]/g, 'u')
    .replace(/\s+/g, ' ')
    .trim();

// Longest keys first, so "cabernet sauvignon" wins over "cabernet" and
// "sparkling red" over "sparkling".
const SORTED_KEYS = Object.keys(VARIETY_PROFILES).sort((a, b) => b.length - a.length);

function lookup(text) {
  if (!text) return null;
  const key = normalise(text);
  if (VARIETY_PROFILES[key]) return VARIETY_PROFILES[key];
  const hit = SORTED_KEYS.find((k) => key.includes(k));
  return hit ? VARIETY_PROFILES[hit] : null;
}

// Styles that have to be spotted in the wine's *name*, ahead of anything the
// Variety column says, because the sheet uses that column loosely.
//
// Two traps this defuses:
//   · The whole fortified section is tagged Variety = "Tawny" or "Sweet",
//     which would score a bone-dry Fino sherry as sweetness 7.
//   · "Recioto della Valpolicella" is a sweet dessert wine, but a plain
//     substring scan matches the longer word "valpolicella" first and calls
//     it a dry red.
//
// Order matters: first match wins.
const STYLE_OVERRIDES = [
  ['recioto', 'recioto'],
  ['vin santo', 'vin santo'],
  ['vinsanto', 'vin santo'],
  ['botrytis', 'botrytis'],
  ['sauternes', 'sauternes'],
  ['amarone', 'amarone'],
  ['fino sherry', 'fino sherry'],
  ['manzanilla', 'manzanilla'],
  ['oloroso', 'oloroso'],
  ['chinato', 'chinato'],
  ['tokay', 'tokay'],
  ['ruby port', 'port'],
];

function lookupOverride(name) {
  if (!name) return null;
  const key = normalise(name);
  const hit = STYLE_OVERRIDES.find(([pattern]) => key.includes(pattern));
  return hit ? VARIETY_PROFILES[hit[1]] : null;
}

/**
 * Work out a taste profile for a wine.
 *
 * Order of preference:
 *   1. explicit body/sweetness/acidity/tannins columns, if the sheet ever gains them
 *   2. an unambiguous style name spotted in the wine's name (see STYLE_OVERRIDES)
 *   3. the Variety column
 *   4. grape names found in the wine's own name (many rows carry "- Shiraz/Cabernet")
 *   5. the menu section it sits under
 *
 * `estimated` records whether we guessed, so the UI can be honest about it.
 */
export function resolveProfile({ variety, name, section, explicit = {} }) {
  const hasExplicit =
    explicit.body != null &&
    explicit.sweetness != null &&
    explicit.acidity != null &&
    explicit.tannins != null;

  if (hasExplicit) {
    return { ...explicit, pairings: explicit.pairings ?? [], estimated: false };
  }

  const found =
    lookupOverride(name) ??
    lookup(variety) ??
    lookup(name) ??
    SECTION_PROFILES[section] ??
    SECTION_PROFILES.Red;

  return {
    body: explicit.body ?? found.body,
    sweetness: explicit.sweetness ?? found.sweetness,
    acidity: explicit.acidity ?? found.acidity,
    tannins: explicit.tannins ?? found.tannins,
    pairings: found.pairings.length ? found.pairings : [SOLO],
    estimated: true,
  };
}
