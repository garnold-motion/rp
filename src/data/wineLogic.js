// src/data/wineLogic.js
//
// All the matching maths for "Find My Wine" lives here, deliberately kept out
// of the components so it can be reasoned about (and tested) on its own.
//
// The idea: punters don't know their own acidity preference on a 1–10 scale,
// but they absolutely know whether they'd rather be at the beach or by a fire.
// So the quiz asks concrete, sensory questions and quietly accumulates a
// target taste vector from the answers. The flavour pad then lets them nudge
// that vector directly if they want to.

// These mirror the venue's own menu sections rather than generic wine
// categories — it's how the printed list is organised and how the staff talk
// about it, so it's what people expect to filter by.
export const CATEGORIES = [
  { id: 'Bubbles', label: 'Bubbles' },
  { id: 'White', label: 'White' },
  { id: 'Italian White', label: 'Italian White' },
  { id: 'Rosé', label: 'Rosé' },
  { id: 'Chilled Red', label: 'Chilled Red' },
  { id: 'Red', label: 'Red' },
  { id: 'Italian Red', label: 'Italian Red' },
  { id: 'Fortified & Sweet', label: 'Fortified & Sweet' },
];

export const CATEGORY_ACCENTS = {
  Bubbles: '#cfd8dc',
  White: '#e0c168',
  'Italian White': '#d6cf8a',
  Rosé: '#d98a94',
  'Chilled Red': '#c96f6a',
  Red: '#b1454f',
  'Italian Red': '#9c3f52',
  'Fortified & Sweet': '#a4632c',
};

export const TRAIT_DESCRIPTORS = {
  body: ['Feather-light', 'Very light', 'Light', 'Light-medium', 'Medium', 'Medium-full', 'Full', 'Rich', 'Bold', 'Powerfully full'],
  sweetness: ['Bone dry', 'Crisp dry', 'Dry', 'Off-dry', 'Hint of sweet', 'Gently sweet', 'Medium-sweet', 'Sweet', 'Very sweet', 'Lusciously sweet'],
  acidity: ['Very low', 'Low', 'Soft', 'Gentle', 'Moderate', 'Fresh', 'Bright', 'Crisp', 'Zesty', 'Racy'],
  tannins: ['Silky', 'Very soft', 'Soft', 'Supple', 'Moderate', 'Textured', 'Firm', 'Grippy', 'Bold', 'Powerfully grippy'],
};

export const describeTrait = (key, value) =>
  TRAIT_DESCRIPTORS[key]?.[Math.min(9, Math.max(0, Math.round(value) - 1))] ?? '';

/* ------------------------------------------------------------------ */
/* The quiz                                                            */
/* ------------------------------------------------------------------ */

// Each option carries deltas applied to the base taste vector.
//
// The questions stay in the language of flavour rather than mood — "citrus or
// dark berries" gets a more reliable answer than "beach or fireplace", because
// people know what they want to taste even when they can't name a grape.

const Q_FLAVOUR = {
  id: 'flavour',
  prompt: 'Which flavours pull you in?',
  options: [
    {
      id: 'citrus',
      label: 'Lemon and grapefruit',
      caption: 'Zesty, crisp, refreshing',
      glyph: 'citrus',
      effects: { body: -2.5, acidity: +2, tannins: -2.5 },
    },
    {
      id: 'dark',
      label: 'Dark berries and spice',
      caption: 'Deep, warming, savoury',
      glyph: 'flame',
      effects: { body: +2.5, acidity: -1, tannins: +2 },
    },
  ],
};

const Q_EATING = {
  id: 'eating',
  prompt: 'Is there food coming, or just the wine?',
  options: [
    {
      id: 'solo',
      label: 'Just the wine',
      caption: 'Drinking on its own merits',
      glyph: 'glass',
      effects: { acidity: +0.5 },
    },
    {
      id: 'food',
      label: "Food's on the way",
      caption: "We'll match it to the plate",
      glyph: 'utensils',
      effects: {},
    },
  ],
};

// Asked only when there's food — otherwise it has nothing to work with.
const Q_PLATE = {
  id: 'plate',
  prompt: "What's on the plate?",
  options: [
    {
      id: 'sea',
      label: 'From the sea',
      caption: 'Oysters, sashimi, grilled fish',
      glyph: 'fish',
      effects: { body: -1.5, acidity: +1.5, tannins: -2 },
    },
    {
      id: 'land',
      label: 'From the land',
      caption: 'Cheese, charcuterie, red meat',
      glyph: 'beef',
      effects: { body: +1.5, tannins: +1.5 },
    },
  ],
};

// The stand-in when someone's drinking on its own. Asking about grip adds a
// genuinely new axis rather than re-asking what we already know.
const Q_TEXTURE = {
  id: 'plate',
  prompt: 'How should it feel to drink?',
  options: [
    {
      id: 'smooth',
      label: 'Smooth and soft',
      caption: 'Easy, nothing to chew on',
      glyph: 'feather',
      effects: { tannins: -2.5, body: -0.5 },
    },
    {
      id: 'grip',
      label: 'With a bit of grip',
      caption: 'Structured, something to hold',
      glyph: 'grape',
      effects: { tannins: +2.5, body: +0.5 },
    },
  ],
};

const Q_PALATE = {
  id: 'palate',
  prompt: 'Which sounds better?',
  options: [
    {
      id: 'apple',
      label: 'A bite of green apple',
      caption: 'Sharp, mouth-watering, clean',
      glyph: 'apple',
      effects: { acidity: +2, sweetness: -1 },
    },
    {
      id: 'honey',
      label: 'A spoonful of honey',
      caption: 'Round, soft, a little sweet',
      glyph: 'honey',
      effects: { acidity: -1.5, sweetness: +2, body: +1 },
    },
  ],
};

const Q_NERVE = {
  id: 'nerve',
  prompt: 'Last one. How brave are you feeling?',
  options: [
    {
      id: 'familiar',
      label: 'Something I know I love',
      caption: 'A safe pair of hands',
      glyph: 'heart',
      effects: {},
    },
    {
      id: 'adventurous',
      label: "Surprise me, I'll try anything",
      caption: 'Pour me something strange',
      glyph: 'compass',
      effects: {},
    },
  ],
};

/**
 * The five questions for the current run. Question three swaps depending on
 * whether food is coming — always five taps either way, so the progress ticks
 * never lie about how much is left.
 */
export function questionsFor(answers = {}) {
  return [
    Q_FLAVOUR,
    Q_EATING,
    answers.eating === 'solo' ? Q_TEXTURE : Q_PLATE,
    Q_PALATE,
    Q_NERVE,
  ];
}

export const QUESTION_COUNT = 5;

// Middle of the road. Sweetness sits low because the overwhelming majority of
// a wine list is dry, so starting at 5 would bias every match toward dessert.
const BASE_VECTOR = { body: 5, sweetness: 2.5, acidity: 5, tannins: 5 };

const clamp = (n, lo = 1, hi = 10) => Math.min(hi, Math.max(lo, n));

/**
 * Fold the chosen quiz answers into a target taste vector.
 * @param {Record<string,string>} answers map of questionId -> optionId
 */
export function vectorFromAnswers(answers) {
  const vector = { ...BASE_VECTOR };

  questionsFor(answers).forEach((q) => {
    const chosen = q.options.find((o) => o.id === answers[q.id]);
    if (!chosen) return;
    Object.entries(chosen.effects).forEach(([trait, delta]) => {
      vector[trait] += delta;
    });
  });

  Object.keys(vector).forEach((k) => {
    vector[k] = clamp(vector[k]);
  });

  return vector;
}

/**
 * Which pairing tags the answers imply. Returns an empty array when the person
 * is drinking on its own — meaning "don't filter on food at all".
 */
export function pairingFromAnswers(answers) {
  // Drinking without food is its own preference, not an absence of one — it
  // favours the aperitif styles. This used to return an empty array, which
  // meant `just_drinking` was tagged on wines but never actually matched
  // against anything.
  if (answers.eating === 'solo') return ['just_drinking'];
  if (answers.eating !== 'food') return [];
  return answers.plate === 'sea'
    ? ['seafood']
    : ['hearty_meats', 'cheese_charcuterie'];
}

export const isAdventurous = (answers) => answers.nerve === 'adventurous';

/* ------------------------------------------------------------------ */
/* The flavour pad                                                     */
/* ------------------------------------------------------------------ */

// x: 0 = light, 1 = bold        (drives body, and tannins for reds)
// y: 0 = crisp, 1 = rich        (drives acidity, inversely)
//
// Sweetness is deliberately NOT touched here. The pad is labelled Light↔Bold
// and Crisp↔Rich, so quietly raising sweetness from the "rich" axis would
// double-count it on top of whatever the quiz already inferred — which pushed
// dessert and fortified wines into the results for people who'd asked for a
// steak wine. Sweetness stays owned by the quiz alone.
export function vectorFromPad({ x, y }, base = BASE_VECTOR) {
  return {
    body: clamp(1 + x * 9),
    acidity: clamp(10 - y * 7.5),
    sweetness: clamp(base.sweetness),
    tannins: clamp(2 + x * 7),
  };
}

export function padFromVector(vector) {
  return {
    x: clamp((vector.body - 1) / 9, 0, 1),
    y: clamp((10 - vector.acidity) / 7.5, 0, 1),
  };
}

const PAD_LABELS = [
  // [yBand][xBand] — crisp→rich down, light→bold across
  ['Bright and easy going', 'Fresh and food-friendly', 'Taut and structured'],
  ['Soft and gentle', 'Balanced, right down the middle', 'Generous and warming'],
  ['Silky and perfumed', 'Round and velvety', 'Big, dark and brooding'],
];

export function describePad({ x, y }) {
  const band = (v) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);
  return PAD_LABELS[band(y)][band(x)];
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

// Sweetness is weighted hardest because getting it wrong is the most jarring
// mistake — a sweet wine served to someone expecting bone dry ruins the pour.
// Tannins are weighted lightest and only counted where they're meaningful.
const WEIGHTS = { body: 1.0, sweetness: 1.4, acidity: 0.9, tannins: 0.6 };
const TANNIC_CATEGORIES = new Set([
  'Red',
  'Italian Red',
  'Chilled Red',
  'Fortified & Sweet',
]);

// Fallbacks for wines whose sheet row is missing a trait — better to score
// them as average than to drop them from the cellar entirely.
const FALLBACK = { body: 5, sweetness: 3, acidity: 5, tannins: 5 };

/**
 * Build a rarity lookup so "surprise me" can favour grapes the cellar only has
 * once or twice, and "something I know" can favour the well-trodden ones.
 */
export function buildRarityIndex(wines) {
  const counts = new Map();
  wines.forEach((w) => {
    const key = w.grape_variety?.toLowerCase();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

/**
 * "Rare" has to be relative to the cellar. A fixed threshold of two bottles
 * means everything looks rare on a short list and nothing looks rare on a long
 * one — so scale it, roughly 2% of the list, with a floor of one.
 */
export function rarityThreshold(total) {
  return Math.max(1, Math.round(total * 0.02));
}

/**
 * Score every wine against a target vector. Lower `distance` is better;
 * `match` is that distance expressed as a friendly percentage.
 *
 * @param {Array} wines
 * @param {{body:number,sweetness:number,acidity:number,tannins:number}} target
 * @param {object} opts
 * @param {string[]} opts.pairings  pairing tags to prefer (empty = ignore)
 * @param {boolean} opts.adventurous
 */
export function scoreWines(wines, target, opts = {}) {
  const { pairings = [], adventurous = null } = opts;
  const rarity = buildRarityIndex(wines);
  const rareAt = rarityThreshold(wines.length);

  const scored = wines.map((wine) => {
    const traits = {
      body: wine.body ?? FALLBACK.body,
      sweetness: wine.sweetness ?? FALLBACK.sweetness,
      acidity: wine.acidity ?? FALLBACK.acidity,
      tannins: wine.tannins ?? FALLBACK.tannins,
    };

    const countTannins = TANNIC_CATEGORIES.has(wine.category);
    const grapeCount = wine.grape_variety
      ? rarity.get(wine.grape_variety.toLowerCase()) ?? 1
      : null;
    const isRare = grapeCount !== null && grapeCount <= rareAt;

    let distance = 0;
    let weightUsed = 0;
    Object.entries(WEIGHTS).forEach(([trait, weight]) => {
      if (trait === 'tannins' && !countTannins) return;
      distance += Math.abs(traits[trait] - target[trait]) * weight;
      weightUsed += weight;
    });

    // Normalise so wines judged on three traits aren't unfairly compared to
    // those judged on four.
    let normalised = distance / weightUsed;

    // Food match is a nudge, not a hard filter — a great wine slightly off the
    // plate still beats a mediocre wine that happens to be tagged right.
    if (pairings.length > 0) {
      const hit = wine.pairing_tags?.some((t) => pairings.includes(t));
      normalised += hit ? -0.6 : 0.35;
    }

    // The bravery question has to actually change the outcome, otherwise it's
    // a decorative tap. Pushing both directions (reward rare when adventurous,
    // penalise it when not) gives it roughly the weight of a full point of
    // body difference — enough to reshuffle, not enough to override taste.
    if (adventurous !== null && grapeCount !== null) {
      if (adventurous) normalised += isRare ? -0.7 : 0.35;
      else normalised += isRare ? 0.5 : -0.3;
    }

    // Distance is at worst ~9 (opposite ends of every scale). Mapping onto
    // 55–99 keeps the number encouraging without making everything look 95%.
    const match = Math.round(clamp(99 - normalised * 9, 55, 99));

    // isRare is carried through so explainMatch can only claim a wine is
    // obscure when it actually is — otherwise "Shiraz is off the beaten
    // track" ends up on screen.
    return { ...wine, distance: normalised, match, isRare };
  });

  scored.sort((a, b) => a.distance - b.distance);
  return scored;
}

/* ------------------------------------------------------------------ */
/* Explaining the pick                                                 */
/* ------------------------------------------------------------------ */

// Kept to single phrases with no internal "and" — these get joined together,
// and fragments that each contain their own conjunction produce sentences like
// "it's full-bodied and generous and soft and mellow and it stands up to...".
const REASON_FRAGMENTS = [
  { trait: 'body', low: 'light on its feet', high: 'full-bodied', tol: 2 },
  { trait: 'acidity', low: 'mellow', high: 'bright', tol: 2 },
  { trait: 'sweetness', low: 'properly dry', high: 'rounded', tol: 2 },
  { trait: 'tannins', low: 'silky', high: 'firmly structured', tol: 2.5 },
];

/**
 * A plain-English sentence explaining why this wine came out on top. This is
 * the bit that makes the app feel like a sommelier rather than a spreadsheet,
 * so it references what the person actually asked for.
 */
export function explainMatch(wine, target, answers = {}) {
  const traits = {
    body: wine.body ?? FALLBACK.body,
    sweetness: wine.sweetness ?? FALLBACK.sweetness,
    acidity: wine.acidity ?? FALLBACK.acidity,
    tannins: wine.tannins ?? FALLBACK.tannins,
  };

  const countTannins = TANNIC_CATEGORIES.has(wine.category);

  // Pick the two traits where the wine lines up most closely with the target —
  // those are the reasons it won.
  const hits = REASON_FRAGMENTS.filter((f) => f.trait !== 'tannins' || countTannins)
    .map((f) => ({ ...f, gap: Math.abs(traits[f.trait] - target[f.trait]) }))
    .filter((f) => f.gap <= f.tol)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 2)
    .map((f) => (traits[f.trait] >= 5.5 ? f.high : f.low));

  // Build independent clauses, then join them with commas and a single
  // trailing "and" — stringing every fragment together with "and" reads like
  // a child's account of their weekend.
  const clauses = [];

  if (hits.length === 2) clauses.push(`it's ${hits[0]} and ${hits[1]}`);
  else if (hits.length === 1) clauses.push(`it's ${hits[0]}`);
  else clauses.push('it sits closest to the profile you built');

  const pairings = pairingFromAnswers(answers);
  if (pairings.length && wine.pairing_tags?.some((t) => pairings.includes(t))) {
    clauses.push(
      answers.plate === 'sea'
        ? 'it holds up beautifully against seafood'
        : 'it stands up to richer plates'
    );
  }

  const joined =
    clauses.length > 1
      ? `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`
      : clauses[0];

  // The rarity aside gets its own sentence rather than a third clause.
  const aside =
    answers.nerve === 'adventurous' && wine.isRare && wine.grape_variety
      ? ` ${wine.grape_variety} is well off the beaten track, too.`
      : '';

  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.${aside}`;
}
