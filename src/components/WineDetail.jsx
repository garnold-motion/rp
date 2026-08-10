// src/components/WineDetail.jsx
//
// Presented as a bottom sheet rather than a route. The app is a single-screen
// tab shell, and a sheet means someone can glance at a wine and dismiss it
// without losing their place in a filtered list they spent a minute building.
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CATEGORY_ACCENTS, describeTrait } from '../data/wineLogic';
import FlavourFingerprint from './FlavourFingerprint';

const TraitBar = ({ label, traitKey, value, accent }) => (
  <div>
    <div className="flex justify-between items-baseline mb-1.5">
      <span className="eyebrow text-[9px] text-cream-faint">{label}</span>
      <span className="font-body text-[11px] text-cream-dim">
        {describeTrait(traitKey, value)}
      </span>
    </div>
    <div className="h-px bg-line relative">
      <motion.div
        className="h-px absolute top-0 left-0"
        style={{ backgroundColor: accent }}
        initial={{ width: 0 }}
        animate={{ width: `${(value / 10) * 100}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  </div>
);

const WineDetail = ({ wine, onClose, targetVector = null }) => {
  // Lock the body scroll behind the sheet so iOS doesn't scroll the list under it.
  useEffect(() => {
    if (!wine) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wine, onClose]);

  const accent = wine ? CATEGORY_ACCENTS[wine.section] ?? 'var(--color-brass)' : null;
  const hasTraits = wine && (wine.body || wine.sweetness || wine.acidity || wine.tannins);

  return (
    <AnimatePresence>
      {wine && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-ink/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[1101] max-h-[92vh] bg-ink-soft border-t border-line rounded-t-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={wine.name}
          >
            <div className="shrink-0 pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-9 h-1 rounded-full bg-line" />
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-cream-faint hover:text-cream transition-colors"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto no-scrollbar px-6 pb-10">
              {wine.image_url && (
                <div className="h-44 -mx-6 mb-6 overflow-hidden relative">
                  <img src={wine.image_url} alt="" className="w-full h-full object-cover opacity-65" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-soft via-transparent to-transparent" />
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="eyebrow text-[9px]" style={{ color: accent }}>
                  {wine.section}
                </span>
                {wine.cellar && (
                  <span className="eyebrow text-[8px] text-cream-faint border border-line px-1.5 py-0.5">
                    Cellar List
                  </span>
                )}
              </div>

              <h2 className="font-display text-3xl text-cream mt-2 leading-tight">{wine.name}</h2>

              {wine.producer && (
                <p className="font-display text-lg italic text-cream-dim mt-1">{wine.producer}</p>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                {[wine.vintage, wine.variety ?? wine.grape_variety, wine.region, wine.country]
                  .filter(Boolean)
                  .map((val, i) => (
                    <span key={i} className="font-body text-[11px] text-cream-faint">
                      {val}
                    </span>
                  ))}
              </div>

              {(wine.organic || wine.vegan) && (
                <div className="flex gap-1.5 mt-3">
                  {wine.organic && (
                    <span className="eyebrow text-[8px] text-brass border border-brass/30 px-2 py-1">
                      Organic
                    </span>
                  )}
                  {wine.vegan && (
                    <span className="eyebrow text-[8px] text-brass border border-brass/30 px-2 py-1">
                      Vegan
                    </span>
                  )}
                </div>
              )}

              {(wine.price_glass || wine.price_bottle) && (
                <div className="flex gap-8 my-6 py-4 border-y border-line-soft">
                  {wine.price_glass && (
                    <div>
                      <div className="eyebrow text-[9px] text-cream-faint mb-1">Glass</div>
                      <div className="font-display text-3xl text-brass leading-none">
                        ${wine.price_glass}
                      </div>
                    </div>
                  )}
                  {wine.price_bottle && (
                    <div>
                      <div className="eyebrow text-[9px] text-cream-faint mb-1">Bottle</div>
                      <div className="font-display text-3xl text-cream leading-none">
                        ${wine.price_bottle}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wine.description && (
                <p className="font-body text-sm text-cream-dim leading-relaxed mb-4">
                  {wine.description}
                </p>
              )}

              {wine.tasting_notes && (
                <blockquote
                  className="font-display text-lg italic text-cream/80 border-l-2 pl-4 my-5"
                  style={{ borderColor: accent }}
                >
                  {wine.tasting_notes}
                </blockquote>
              )}

              {hasTraits && (
                <div className="mt-7">
                  <div className="eyebrow text-[9px] text-cream-faint mb-4">Flavour profile</div>

                  <div className="flex items-center gap-6">
                    <div className="shrink-0">
                      <FlavourFingerprint
                        wine={wine}
                        size={132}
                        accent={accent}
                        ghost={targetVector}
                      />
                    </div>

                    <div className="flex-1 space-y-4 min-w-0">
                      {wine.body != null && (
                        <TraitBar label="Body" traitKey="body" value={wine.body} accent={accent} />
                      )}
                      {wine.acidity != null && (
                        <TraitBar label="Acidity" traitKey="acidity" value={wine.acidity} accent={accent} />
                      )}
                      {wine.sweetness != null && (
                        <TraitBar label="Sweetness" traitKey="sweetness" value={wine.sweetness} accent={accent} />
                      )}
                      {wine.tannins != null && (
                        <TraitBar label="Tannins" traitKey="tannins" value={wine.tannins} accent={accent} />
                      )}
                    </div>
                  </div>

                  {targetVector && (
                    <p className="font-body text-[10px] text-cream-faint mt-3">
                      Dashed outline is the profile you asked for.
                    </p>
                  )}

                  {/* Be straight about where these numbers come from — they're
                      derived from the grape, not tasted and scored per bottle. */}
                  {wine.estimatedProfile && (
                    <p className="font-body text-[10px] text-cream-faint mt-3 leading-relaxed">
                      Typical profile for {wine.variety ?? 'this style'}. Individual
                      bottles vary — ask our staff if you'd like a proper steer.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-8 p-4 border border-line-soft bg-card">
                <div className="eyebrow text-[9px] text-brass mb-1.5">Ready to order?</div>
                <p className="font-body text-xs text-cream-dim leading-relaxed">
                  Ask our staff for the{' '}
                  <span className="text-cream">
                    {[wine.producer, wine.name, wine.vintage].filter(Boolean).join(' ')}
                  </span>
                  {wine.price_glass ? ' — available by the glass or bottle.' : ' — available by the bottle.'}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WineDetail;
