// src/components/WineListRow.jsx
//
// The dense view, and the default one. On a 700-bottle list this is what people
// actually use — it reads like the printed wine list, so it stays typographic
// and lets the eye run straight down the prices on the right.
import { CATEGORY_ACCENTS } from '../data/wineLogic';

const WineListRow = ({ wine, onSelect }) => {
  const accent = CATEGORY_ACCENTS[wine.section] ?? 'var(--color-brass)';

  const subtitle = [wine.producer, wine.variety, wine.region]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      onClick={() => onSelect?.(wine)}
      className="group w-full text-left flex items-baseline gap-3 py-3 px-1 hover:bg-card-lift/40 transition-colors"
    >
      <span
        className="w-1 h-1 rounded-full shrink-0 self-center"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-base text-cream group-hover:text-brass-soft transition-colors truncate">
            {wine.name}
          </h3>
          {wine.vintage && (
            <span className="font-body text-[10px] text-cream-faint shrink-0">{wine.vintage}</span>
          )}
          {wine.organic && (
            <span className="font-body text-[8px] text-brass/70 shrink-0" title="Organic">
              ORG
            </span>
          )}
          {wine.vegan && (
            <span className="font-body text-[8px] text-brass/70 shrink-0" title="Vegan">
              VGN
            </span>
          )}
        </div>
        {subtitle && (
          <p className="font-body text-[11px] text-cream-dim truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-baseline gap-3 shrink-0 font-display">
        {wine.price_glass ? (
          <span className="text-brass text-base">${wine.price_glass}</span>
        ) : (
          <span className="text-cream-faint text-xs font-body">—</span>
        )}
        <span className="text-cream text-base w-10 text-right">
          {wine.price_bottle ? `$${wine.price_bottle}` : ''}
        </span>
      </div>
    </button>
  );
};

export default WineListRow;
