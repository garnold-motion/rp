// src/components/find/Reveal.jsx
//
// The payoff. Everything before this was data entry — this is the moment the
// app has to feel like a person handing you a glass, so it gets a beat of
// anticipation, a counting match score, and a sentence explaining the choice.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORY_ACCENTS, explainMatch } from '../../data/wineLogic';
import FlavourFingerprint from '../FlavourFingerprint';

/** Ticks a number up to its target — small touch, but it draws the eye. */
const CountUp = ({ to, duration = 900, className }) => {
  const [n, setN] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic, so it decelerates into the final number
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <span className={className}>{n}</span>;
};

const Reveal = ({ wine, target, answers, onOpen, onStartAgain }) => {
  const accent = CATEGORY_ACCENTS[wine.category] ?? 'var(--color-brass)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="eyebrow text-[9px] text-brass mb-3"
      >
        We'd pour you this
      </motion.p>

      {/* The card itself scales up from a thin line, like a glass being filled */}
      <motion.div
        initial={{ scaleY: 0.04, opacity: 0.4 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 20, delay: 0.15 }}
        style={{ originY: 0.5 }}
        className="relative bg-card border border-line overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(70% 50% at 50% 0%, ${accent}55, transparent 70%)`,
          }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="relative p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <span className="eyebrow text-[9px]" style={{ color: accent }}>
              {wine.category}
            </span>
            <div className="text-right shrink-0">
              <div className="font-display text-4xl leading-none text-brass">
                <CountUp to={wine.match} />
                <span className="text-xl">%</span>
              </div>
              <div className="eyebrow text-[8px] text-cream-faint mt-1">Match</div>
            </div>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl text-cream leading-[1.05]">
            {wine.name}
          </h2>

          {wine.producer && (
            <p className="font-display text-xl italic text-cream-dim mt-1.5">{wine.producer}</p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {[wine.vintage, wine.grape_variety, wine.region, wine.country]
              .filter(Boolean)
              .map((v, i) => (
                <span key={i} className="font-body text-[11px] text-cream-faint">
                  {v}
                </span>
              ))}
          </div>

          {/* The reasoning line — this is what separates it from a filter */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.35 }}
            className="font-body text-sm text-cream-dim leading-relaxed mt-5 pt-5 border-t border-line-soft"
          >
            {explainMatch(wine, target, answers)}
          </motion.p>

          {wine.tasting_notes && (
            <blockquote
              className="font-display text-lg italic text-cream/75 border-l-2 pl-4 mt-5"
              style={{ borderColor: accent }}
            >
              {wine.tasting_notes}
            </blockquote>
          )}

          <div className="flex items-center gap-6 mt-6">
            <div className="shrink-0">
              <FlavourFingerprint wine={wine} size={116} accent={accent} ghost={target} />
            </div>

            <div className="flex-1 flex flex-wrap gap-x-6 gap-y-3">
              {wine.price_glass && (
                <div>
                  <div className="eyebrow text-[8px] text-cream-faint mb-1">Glass</div>
                  <div className="font-display text-3xl text-brass leading-none">
                    ${wine.price_glass}
                  </div>
                </div>
              )}
              {wine.price_bottle && (
                <div>
                  <div className="eyebrow text-[8px] text-cream-faint mb-1">Bottle</div>
                  <div className="font-display text-3xl text-cream leading-none">
                    ${wine.price_bottle}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={() => onOpen(wine)}
              className="flex-1 min-w-[140px] bg-brass text-ink py-3.5 eyebrow text-[10px] hover:bg-brass-soft transition-colors"
            >
              Full Details
            </button>
            <button
              onClick={onStartAgain}
              className="flex-1 min-w-[140px] border border-line text-cream-dim py-3.5 eyebrow text-[10px] hover:border-brass/50 hover:text-cream transition-colors"
            >
              Start Again
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Reveal;
