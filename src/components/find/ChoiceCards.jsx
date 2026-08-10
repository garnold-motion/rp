// src/components/find/ChoiceCards.jsx
//
// One question, two big tappable cards. Deliberately oversized: this is meant
// to be used one-handed, in low light, half a glass in.

import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Flame, Wine, Utensils, Fish, Beef, Apple, Droplet, Heart, Compass,
  Feather, Grape, Citrus,
} from 'lucide-react';

const GLYPHS = {
  sun: Sun,
  flame: Flame,
  glass: Wine,
  utensils: Utensils,
  fish: Fish,
  beef: Beef,
  apple: Apple,
  honey: Droplet,
  heart: Heart,
  compass: Compass,
  feather: Feather,
  grape: Grape,
  citrus: Citrus,
};

const ChoiceCards = ({ question, index, total, onChoose, onBack, direction = 1 }) => (
  <div>
    {/* Progress ticks — cheap, and makes the flow feel finite */}
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-px flex-1 transition-colors duration-300 ${
            i < index ? 'bg-brass' : i === index ? 'bg-brass/50' : 'bg-line'
          }`}
        />
      ))}
      <span className="eyebrow text-[9px] text-cream-faint ml-2 shrink-0">
        {index + 1}/{total}
      </span>
    </div>

    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={question.id}
        custom={direction}
        initial={(d) => ({ opacity: 0, x: d * 24 })}
        animate={{ opacity: 1, x: 0 }}
        exit={(d) => ({ opacity: 0, x: d * -24 })}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <h2 className="font-display text-2xl sm:text-3xl text-cream leading-tight mb-5">
          {question.prompt}
        </h2>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {question.options.map((option, i) => {
            const Glyph = GLYPHS[option.glyph] ?? Wine;
            return (
              <motion.button
                key={option.id}
                onClick={() => onChoose(question.id, option.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06, duration: 0.28 }}
                whileTap={{ scale: 0.975 }}
                className="group relative overflow-hidden text-left px-5 py-4 flex items-center gap-4 sm:flex-col sm:items-start sm:justify-between sm:gap-0 sm:min-h-[132px] bg-card border border-line-soft hover:border-brass/50 transition-colors duration-300"
              >
                {/* Warm wash that blooms on hover, echoing the venue lighting */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(80%_60%_at_50%_0%,rgb(201_162_39/0.14),transparent_70%)]" />

                <Glyph
                  size={22}
                  strokeWidth={1.2}
                  className="relative shrink-0 text-brass/70 group-hover:text-brass transition-colors"
                />

                {/* Side-by-side on a phone so two cards fit without scrolling;
                    stacked on wider screens where there's room to breathe. */}
                <div className="relative min-w-0 sm:mt-4">
                  <div className="font-display text-xl sm:text-2xl text-cream group-hover:text-brass-soft transition-colors leading-tight">
                    {option.label}
                  </div>
                  <div className="font-body text-[11px] text-cream-faint mt-1 leading-snug">
                    {option.caption}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>

    {index > 0 && (
      <button
        onClick={onBack}
        className="mt-5 eyebrow text-[9px] text-cream-faint hover:text-cream-dim transition-colors"
      >
        ← Back
      </button>
    )}
  </div>
);

export default ChoiceCards;
