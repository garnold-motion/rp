// src/components/Home.jsx
//
// The landing screen someone sees after scanning the QR at their table. Its
// only real job is to get them into "Find My Wine" within one tap — everything
// else is supporting cast.

import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Clock, Sparkles, Grape } from 'lucide-react';
import { VENUE } from '../config/venue';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

const Home = ({ setActiveTab, specials = [] }) => {
  const featured = specials[0];

  return (
    <div className="w-full">
      {/* ---------------- Hero ---------------- */}
      <section className="relative min-h-[72vh] flex items-center justify-center overflow-hidden px-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${VENUE.heroImage}')` }}
        />
        {/* Warm scrim rather than a flat black overlay — keeps the timber tones */}
        <div className="absolute inset-0 bg-ink/75" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgb(20 16 13 / 0.35) 0%, transparent 35%, var(--color-ink) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(55% 45% at 50% 38%, rgb(201 162 39 / 0.16), transparent 70%)',
          }}
        />

        <div className="relative z-10 text-center max-w-lg mx-auto py-20">
          <motion.p {...fade(0.05)} className="eyebrow text-brass mb-6">
            {VENUE.tagline}
          </motion.p>

          <motion.h1
            {...fade(0.12)}
            className="font-display text-6xl sm:text-7xl text-cream leading-[0.92] mb-6"
          >
            The Running
            <br />
            <em className="text-brass font-normal">Postman</em>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="font-body text-sm text-cream-dim leading-relaxed max-w-xs mx-auto mb-10"
          >
            Your digital sommelier. Answer a few questions and we'll find you
            something from the cellar you'll actually love.
          </motion.p>

          <motion.div {...fade(0.28)} className="flex flex-col gap-3">
            <button
              onClick={() => setActiveTab('find')}
              className="group flex items-center justify-center gap-3 bg-brass text-ink px-8 py-4 eyebrow text-[10px] hover:bg-brass-soft transition-colors"
            >
              <Sparkles size={14} strokeWidth={1.6} />
              Find My Wine
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className="flex items-center justify-center gap-3 border border-line text-cream px-8 py-4 eyebrow text-[10px] hover:border-brass/50 transition-colors"
            >
              <Grape size={14} strokeWidth={1.5} />
              Browse the Cellar
            </button>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Featured special ---------------- */}
      {featured && (
        <section className="px-6 -mt-6 relative z-10">
          <motion.button
            {...fade(0.1)}
            onClick={() => setActiveTab('contact')}
            className="group w-full max-w-2xl mx-auto flex items-stretch text-left bg-card border border-brass/30 overflow-hidden hover:border-brass/60 transition-colors"
          >
            <span className="w-1 shrink-0 bg-brass" />
            <span className="flex-1 p-5">
              <span className="eyebrow text-[8px] text-brass">{featured.label}</span>
              <span className="block font-display text-2xl text-cream mt-1.5 leading-tight">
                {featured.wine_name ?? featured.title}
              </span>
              {featured.producer && (
                <span className="block font-body text-[11px] text-cream-dim mt-0.5">
                  {[featured.producer, featured.vintage, featured.region].filter(Boolean).join(' · ')}
                </span>
              )}
              <span className="flex items-center gap-2 mt-3 eyebrow text-[9px] text-brass">
                Open now at the bar
                <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </span>
            {(featured.price_glass || featured.price_bottle) && (
              <span className="shrink-0 flex flex-col justify-center items-end p-5 border-l border-line-soft">
                {featured.price_glass && (
                  <>
                    <span className="eyebrow text-[8px] text-cream-faint">Glass</span>
                    <span className="font-display text-2xl text-brass leading-none mt-0.5">
                      ${featured.price_glass}
                    </span>
                  </>
                )}
              </span>
            )}
          </motion.button>
        </section>
      )}

      {/* ---------------- Info strip ---------------- */}
      <section className="mt-14 border-y border-line-soft bg-card/40">
        <div className="max-w-3xl mx-auto px-6 py-8 grid sm:grid-cols-2 gap-8">
          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-brass shrink-0 mt-1" strokeWidth={1.4} />
            <div>
              <div className="eyebrow text-[9px] text-cream-faint mb-1.5">Find us</div>
              <div className="font-display text-lg text-cream leading-snug">{VENUE.address}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={15} className="text-brass shrink-0 mt-1" strokeWidth={1.4} />
            <div>
              <div className="eyebrow text-[9px] text-cream-faint mb-1.5">Hours</div>
              {VENUE.hours.map((line) => (
                <div key={line.days} className="font-display text-lg text-cream leading-snug">
                  {line.days} <span className="text-cream-dim">· {line.time}</span>
                </div>
              ))}
              <div className="eyebrow text-[9px] text-brass mt-2.5">{VENUE.happyHour}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Quote ---------------- */}
      <section className="py-16 px-6 text-center">
        <blockquote className="font-display text-2xl md:text-3xl italic text-cream-dim max-w-lg mx-auto leading-snug">
          "Wine is sunlight, held together by water."
        </blockquote>
        <p className="eyebrow text-[9px] text-cream-faint mt-4">— Galileo Galilei</p>
      </section>
    </div>
  );
};

export default Home;
