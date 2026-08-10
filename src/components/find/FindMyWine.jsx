// src/components/find/FindMyWine.jsx
//
// Flow: five this-or-that taps → one flavour pad → the reveal.
// Filters exist, but they live *below* the result and start collapsed. Fun
// first, precision second — the opposite order to a normal filter UI.

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, Dices } from 'lucide-react';

import ChoiceCards from './ChoiceCards';
import FlavourPad from './FlavourPad';
import Reveal from './Reveal';
import WineCard from '../WineCard';
import {
  questionsFor,
  QUESTION_COUNT,
  CATEGORIES,
  vectorFromAnswers,
  vectorFromPad,
  padFromVector,
  pairingFromAnswers,
  isAdventurous,
  scoreWines,
  describePad,
} from '../../data/wineLogic';

const RUNNER_UP_COUNT = 4;

const FindMyWine = ({ wines, isLoading, onSelectWine }) => {
  // 'quiz' → 'pad' → 'result'
  const [stage, setStage] = useState('quiz');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({});
  const [pad, setPad] = useState({ x: 0.5, y: 0.5 });

  // Filters applied on the results screen
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState(500);
  const [priceUnlimited, setPriceUnlimited] = useState(false);
  const [glassOnly, setGlassOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showCount, setShowCount] = useState(RUNNER_UP_COUNT);

  // Question three swaps depending on whether food is coming, so the list is
  // derived from the answers rather than fixed.
  const questions = useMemo(() => questionsFor(answers), [answers]);

  const quizVector = useMemo(() => vectorFromAnswers(answers), [answers]);
  const target = useMemo(() => vectorFromPad(pad, quizVector), [pad, quizVector]);

  const countries = useMemo(
    () => ['All', ...Array.from(new Set(wines.map((w) => w.country).filter(Boolean))).sort()],
    [wines]
  );

  const ranked = useMemo(() => {
    if (wines.length === 0) return [];

    let pool = wines;
    if (categoryFilter !== 'All') pool = pool.filter((w) => w.category === categoryFilter);
    if (countryFilter !== 'All') pool = pool.filter((w) => w.country === countryFilter);
    if (glassOnly) pool = pool.filter((w) => w.price_glass != null);
    pool = pool.filter((w) => {
      const price = w.effective_bottle_price;
      if (price == null) return true;
      return priceUnlimited ? price > 500 : price <= maxPrice;
    });

    return scoreWines(pool, target, {
      pairings: pairingFromAnswers(answers),
      adventurous: answers.nerve ? isAdventurous(answers) : null,
    });
  }, [wines, target, answers, categoryFilter, countryFilter, glassOnly, maxPrice, priceUnlimited]);

  const handleChoose = useCallback(
    (questionId, optionId) => {
      // Changing the food answer invalidates question three, since the two
      // variants have different option ids.
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: optionId };
        if (questionId === 'eating' && prev.eating !== optionId) delete next.plate;
        return next;
      });
      setDirection(1);

      if (questionIndex < QUESTION_COUNT - 1) {
        setQuestionIndex((i) => i + 1);
      } else {
        // Seed the pad from what the quiz inferred, so the dot lands somewhere
        // meaningful rather than dead centre.
        setPad(padFromVector(vectorFromAnswers({ ...answers, [questionId]: optionId })));
        setStage('pad');
      }
    },
    [questionIndex, answers]
  );

  const handleBack = useCallback(() => {
    setDirection(-1);
    setQuestionIndex((i) => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    setStage('quiz');
    setQuestionIndex(0);
    setDirection(1);
    setAnswers({});
    setPad({ x: 0.5, y: 0.5 });
    setCategoryFilter('All');
    setCountryFilter('All');
    setMaxPrice(500);
    setPriceUnlimited(false);
    setGlassOnly(false);
    setFiltersOpen(false);
    setShowCount(RUNNER_UP_COUNT);
  }, []);

  // Dealer's choice — skips everything and pours something at random. A
  // surprising number of people genuinely just want this.
  const surpriseMe = useCallback(() => {
    if (wines.length === 0) return;
    const pick = wines[Math.floor(Math.random() * wines.length)];
    setAnswers({});
    setPad(
      padFromVector({
        body: pick.body ?? 5,
        acidity: pick.acidity ?? 5,
        sweetness: pick.sweetness ?? 3,
        tannins: pick.tannins ?? 5,
      })
    );
    setStage('result');
  }, [wines]);

  const best = ranked[0];
  const runnersUp = ranked.slice(1, 1 + showCount);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-5 pb-10 w-full">
      {/* No heading at all — the fixed header carries the title. Every pixel
          here is needed to keep the whole flow on one phone screen. */}
      {isLoading && wines.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-card border border-line-soft animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ---------------- Quiz ---------------- */}
          {stage === 'quiz' && (
            <motion.div key="quiz" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <ChoiceCards
                question={questions[questionIndex]}
                index={questionIndex}
                total={QUESTION_COUNT}
                direction={direction}
                onChoose={handleChoose}
                onBack={handleBack}
              />

              {questionIndex === 0 && (
                <button
                  onClick={surpriseMe}
                  className="mt-5 w-full flex items-center justify-center gap-2.5 border border-line py-3.5 eyebrow text-[9px] text-cream-faint hover:text-brass hover:border-brass/40 transition-colors"
                >
                  <Dices size={14} strokeWidth={1.4} />
                  Skip it — just pour me something
                </button>
              )}
            </motion.div>
          )}

          {/* ---------------- Flavour pad ---------------- */}
          {stage === 'pad' && (
            <motion.div
              key="pad"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <h2 className="font-display text-2xl sm:text-3xl text-cream leading-tight mb-1.5">
                Nearly there. Fine-tune it.
              </h2>
              <p className="font-body text-xs text-cream-dim mb-5">
                We've placed the dot from your answers. Move it if something else
                sounds better.
              </p>

              <FlavourPad value={pad} onChange={setPad} size={264} />

              <button
                onClick={() => setStage('result')}
                className="mt-6 w-full bg-brass text-ink py-4 eyebrow text-[10px] hover:bg-brass-soft transition-colors"
              >
                Pour My Match →
              </button>

              <button
                onClick={() => {
                  setDirection(-1);
                  setStage('quiz');
                  setQuestionIndex(QUESTION_COUNT - 1);
                }}
                className="mt-3 w-full eyebrow text-[9px] text-cream-faint hover:text-cream-dim transition-colors"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ---------------- Result ---------------- */}
          {stage === 'result' && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {best ? (
                <Reveal
                  wine={best}
                  target={target}
                  answers={answers}
                  onOpen={onSelectWine}
                  onStartAgain={reset}
                />
              ) : (
                <div className="text-center py-16 border border-line-soft bg-card">
                  <p className="font-display text-2xl text-cream-dim">
                    Nothing in the cellar fits that
                  </p>
                  <p className="font-body text-sm text-cream-faint mt-2">
                    Loosen the filters below and we'll try again.
                  </p>
                </div>
              )}

              {/* ---- Live filter panel ---- */}
              <div className="mt-8 border border-line-soft bg-card/60">
                <button
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-card-lift/40 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <SlidersHorizontal size={15} className="text-brass" strokeWidth={1.4} />
                    <span className="eyebrow text-[9px] text-cream-dim">Adjust</span>
                  </span>

                  <span className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1.5">
                      {[
                        describePad(pad),
                        categoryFilter !== 'All' ? categoryFilter : null,
                        countryFilter !== 'All' ? countryFilter : null,
                        priceUnlimited ? '$500+' : maxPrice < 500 ? `≤$${maxPrice}` : null,
                      ]
                        .filter(Boolean)
                        .map((chip) => (
                          <span
                            key={chip}
                            className="font-body text-[9px] text-brass/70 border border-brass/20 px-2 py-0.5"
                          >
                            {chip}
                          </span>
                        ))}
                    </span>
                    <motion.span animate={{ rotate: filtersOpen ? 180 : 0 }}>
                      <ChevronDown size={15} className="text-cream-faint" />
                    </motion.span>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {filtersOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-line-soft"
                    >
                      <div className="px-5 py-6 space-y-7">
                        <FlavourPad value={pad} onChange={setPad} size={240} />

                        <div>
                          <div className="eyebrow text-[9px] text-cream-faint mb-3">Category</div>
                          <div className="flex flex-wrap gap-1.5">
                            {['All', ...CATEGORIES.map((c) => c.id)].map((cat) => (
                              <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`eyebrow text-[9px] px-3 py-1.5 border transition-colors ${
                                  categoryFilter === cat
                                    ? 'border-brass bg-brass/10 text-brass'
                                    : 'border-line text-cream-faint hover:border-cream-faint'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="eyebrow text-[9px] text-cream-faint">Budget</span>
                            <div className="flex items-center gap-3">
                              <span className="font-body text-[11px] text-brass">
                                {priceUnlimited ? '$500+' : `Up to $${maxPrice}`}
                              </span>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={priceUnlimited}
                                  onChange={(e) => setPriceUnlimited(e.target.checked)}
                                  className="accent-brass"
                                />
                                <span className="font-body text-[10px] text-cream-faint">$500+</span>
                              </label>
                            </div>
                          </div>
                          {!priceUnlimited && (
                            <input
                              type="range"
                              min="20"
                              max="500"
                              step="10"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(Number(e.target.value))}
                            />
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={glassOnly}
                              onChange={(e) => setGlassOnly(e.target.checked)}
                              className="accent-brass"
                            />
                            <span className="font-body text-xs text-cream-dim">
                              By the glass only
                            </span>
                          </label>

                          <select
                            value={countryFilter}
                            onChange={(e) => setCountryFilter(e.target.value)}
                            className="bg-ink-soft border border-line text-cream font-body text-xs px-3 py-2 focus:outline-none focus:border-brass/50"
                          >
                            {countries.map((c) => (
                              <option key={c} value={c}>
                                {c === 'All' ? 'Any country' : c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---- Runners-up ---- */}
              {runnersUp.length > 0 && (
                <div className="mt-12">
                  <p className="eyebrow text-[9px] text-cream-faint mb-4">
                    Also worth a look
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {runnersUp.map((wine) => (
                      <WineCard key={wine.id} wine={wine} onSelect={onSelectWine} showMatch />
                    ))}
                  </div>

                  {ranked.length > 1 + showCount && (
                    <button
                      onClick={() => setShowCount((c) => c + RUNNER_UP_COUNT)}
                      className="mt-6 w-full border border-line py-3.5 eyebrow text-[9px] text-cream-faint hover:text-brass hover:border-brass/40 transition-colors"
                    >
                      Show more · {ranked.length - 1 - showCount} left
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default FindMyWine;
