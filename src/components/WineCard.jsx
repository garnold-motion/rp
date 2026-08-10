// src/components/WineCard.jsx
import { motion } from 'framer-motion';
import { CATEGORY_ACCENTS } from '../data/wineLogic';
import FlavourFingerprint from './FlavourFingerprint';

const Badge = ({ children }) => (
  <span className="eyebrow text-[8px] text-cream-faint border border-line px-1.5 py-0.5">
    {children}
  </span>
);

const WineCard = ({ wine, onSelect, showMatch = false }) => {
  const accent = CATEGORY_ACCENTS[wine.section] ?? 'var(--color-brass)';

  return (
    <motion.button
      layout
      onClick={() => onSelect?.(wine)}
      whileTap={{ scale: 0.985 }}
      className="group relative w-full text-left bg-card border border-line-soft hover:border-brass/40 transition-colors duration-300 overflow-hidden flex flex-col"
    >
      {showMatch && (
        <div className="absolute top-0 right-0 z-10 bg-brass text-ink px-2.5 py-1">
          <span className="font-body text-[10px] font-semibold tracking-wider">
            {wine.match}%
          </span>
        </div>
      )}

      <div className="relative h-32 overflow-hidden bg-ink-soft shrink-0">
        {wine.image_url ? (
          <img
            src={wine.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-[1.04] transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FlavourFingerprint wine={wine} size={96} showLabels={false} accent={accent} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <span className="eyebrow text-[8px] mb-1.5" style={{ color: accent }}>
          {wine.variety ?? wine.section}
        </span>

        <h3 className="font-display text-lg leading-tight text-cream group-hover:text-brass-soft transition-colors">
          {wine.name}
        </h3>

        {(wine.producer || wine.vintage) && (
          <p className="font-body text-[11px] text-cream-dim mt-0.5 truncate">
            {[wine.producer, wine.vintage].filter(Boolean).join(' · ')}
          </p>
        )}

        {(wine.region || wine.country) && (
          <p className="font-body text-[10px] text-cream-faint mt-0.5 truncate">
            {[wine.region, wine.country].filter(Boolean).join(', ')}
          </p>
        )}

        {(wine.organic || wine.vegan || wine.price_glass) && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {wine.price_glass && <Badge>By the glass</Badge>}
            {wine.organic && <Badge>Organic</Badge>}
            {wine.vegan && <Badge>Vegan</Badge>}
          </div>
        )}

        <div className="flex items-end gap-4 mt-auto pt-3">
          {wine.price_glass && (
            <div>
              <div className="eyebrow text-[8px] text-cream-faint">Glass</div>
              <div className="font-display text-xl text-brass leading-none mt-0.5">
                ${wine.price_glass}
              </div>
            </div>
          )}
          {wine.price_bottle && (
            <div>
              <div className="eyebrow text-[8px] text-cream-faint">Bottle</div>
              <div className="font-display text-xl text-cream leading-none mt-0.5">
                ${wine.price_bottle}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default WineCard;
