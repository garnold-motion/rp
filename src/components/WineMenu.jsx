// src/components/WineMenu.jsx
//
// The full cellar — around 700 bottles. At that size the search box and the
// section chips do almost all the work, so everything else is collapsed behind
// one toggle.
//
// Two things are specific to this list:
//   · Sections are the venue's own (Bubbles, Italian White, Chilled Red …)
//     rather than generic wine categories, because that's how the printed list
//     is arranged and how staff describe it.
//   · The back-vintage "Cellar List" is hidden by default. It's a large block
//     of old and expensive bottles that would otherwise swamp the main list.

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, LayoutGrid, List, SlidersHorizontal, ChevronDown, Archive } from 'lucide-react';

import WineCard from './WineCard';
import WineListRow from './WineListRow';
import { CATEGORIES } from '../data/wineLogic';

const SECTION_CHIPS = ['All', ...CATEGORIES.map((c) => c.id)];

const PRICE_MAX = 800;

const WineMenu = ({ wines, isLoading, error, onSelectWine }) => {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('All');
  const [country, setCountry] = useState('All');
  const [variety, setVariety] = useState('All');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [veganOnly, setVeganOnly] = useState(false);
  const [glassOnly, setGlassOnly] = useState(false);
  const [showCellar, setShowCellar] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The main list and the back-vintage cellar are treated as two separate
  // bodies of wine — you're either browsing what's pouring, or you're digging
  // through the archive.
  const pool = useMemo(
    () => wines.filter((w) => (showCellar ? w.cellar : !w.cellar)),
    [wines, showCellar]
  );

  const cellarCount = useMemo(() => wines.filter((w) => w.cellar).length, [wines]);

  const countries = useMemo(
    () => ['All', ...Array.from(new Set(pool.map((w) => w.country).filter(Boolean))).sort()],
    [pool]
  );

  // Varieties are scoped to the chosen section — the full list of grapes across
  // 700 wines is unusable as a dropdown.
  const varieties = useMemo(() => {
    if (section === 'All') return [];
    const found = Array.from(
      new Set(pool.filter((w) => w.section === section).map((w) => w.variety).filter(Boolean))
    ).sort();
    return found.length > 1 ? ['All', ...found] : [];
  }, [pool, section]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = pool.filter((w) => {
      if (term) {
        const haystack = [w.fullName, w.producer, w.region, w.country, w.variety, w.grape_variety]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (section !== 'All' && w.section !== section) return false;
      if (country !== 'All' && w.country !== country) return false;
      if (variety !== 'All' && w.variety !== variety) return false;
      if (organicOnly && !w.organic) return false;
      if (veganOnly && !w.vegan) return false;
      if (glassOnly && w.price_glass == null) return false;
      if (maxPrice < PRICE_MAX && (w.effective_bottle_price ?? 0) > maxPrice) return false;
      return true;
    });

    const sorted = [...result];
    if (sortBy === 'alpha') sorted.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (sortBy === 'price_asc')
      sorted.sort((a, b) => (a.effective_bottle_price ?? 1e9) - (b.effective_bottle_price ?? 1e9));
    if (sortBy === 'price_desc')
      sorted.sort((a, b) => (b.effective_bottle_price ?? -1) - (a.effective_bottle_price ?? -1));
    return sorted;
  }, [
    pool, search, section, country, variety, organicOnly, veganOnly,
    glassOnly, maxPrice, sortBy,
  ]);

  const activeFilterCount = [
    country !== 'All',
    variety !== 'All',
    organicOnly,
    veganOnly,
    glassOnly,
    maxPrice < PRICE_MAX,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCountry('All');
    setVariety('All');
    setOrganicOnly(false);
    setVeganOnly(false);
    setGlassOnly(false);
    setMaxPrice(PRICE_MAX);
  };

  if (error && wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center px-6 py-24 gap-2">
        <p className="eyebrow text-brass">Couldn't load the cellar</p>
        <p className="font-body text-xs text-cream-faint">
          Check your connection and try again shortly.
        </p>
      </div>
    );
  }

  // No page heading here — the fixed header already says "The Cellar", and on a
  // phone a second title just pushes the search box below the fold.
  return (
    <div className="max-w-5xl mx-auto px-6 pt-5 pb-12 w-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-faint pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search wine, producer, grape, region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-line text-cream font-body text-sm pl-11 pr-10 py-3.5 focus:outline-none focus:border-brass/50 placeholder:text-cream-faint"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-cream-faint hover:text-cream"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Section chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1 mb-3">
        {SECTION_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setSection(chip);
              setVariety('All');
            }}
            className={`shrink-0 eyebrow text-[9px] px-4 py-2.5 border transition-colors ${
              section === chip
                ? 'border-brass bg-brass/10 text-brass'
                : 'border-line text-cream-faint hover:border-cream-faint'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Cellar List toggle */}
      {cellarCount > 0 && (
        <button
          onClick={() => {
            setShowCellar((v) => !v);
            setSection('All');
            setVariety('All');
          }}
          className={`w-full flex items-center justify-between px-4 py-2.5 mb-3 border transition-colors ${
            showCellar
              ? 'border-brass bg-brass/10 text-brass'
              : 'border-line-soft text-cream-faint hover:border-cream-faint'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Archive size={14} strokeWidth={1.4} />
            <span className="eyebrow text-[9px]">
              {showCellar ? 'Viewing the Cellar List' : 'Cellar List · aged & rare'}
            </span>
          </span>
          <span className="font-body text-[10px]">
            {showCellar ? 'Back to the main list' : `${cellarCount} bottles`}
          </span>
        </button>
      )}

      {/* Advanced filters */}
      <div className="border border-line-soft bg-card/50 mb-4">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-lift/40 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <SlidersHorizontal size={14} className="text-brass" strokeWidth={1.4} />
            <span className="eyebrow text-[9px] text-cream-dim">Filters</span>
            {activeFilterCount > 0 && (
              <span className="font-body text-[9px] text-ink bg-brass px-1.5 py-0.5 leading-none">
                {activeFilterCount}
              </span>
            )}
          </span>
          <motion.span animate={{ rotate: filtersOpen ? 180 : 0 }}>
            <ChevronDown size={15} className="text-cream-faint" />
          </motion.span>
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
              <div className="px-4 py-5 space-y-5">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="bg-ink-soft border border-line text-cream font-body text-xs px-3 py-2.5 focus:outline-none focus:border-brass/50"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c === 'All' ? 'Any country' : c}
                      </option>
                    ))}
                  </select>

                  {varieties.length > 0 && (
                    <select
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      className="bg-ink-soft border border-line text-cream font-body text-xs px-3 py-2.5 focus:outline-none focus:border-brass/50"
                    >
                      {varieties.map((v) => (
                        <option key={v} value={v}>
                          {v === 'All' ? 'Any variety' : v}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  {[
                    ['By the glass', glassOnly, setGlassOnly],
                    ['Organic', organicOnly, setOrganicOnly],
                    ['Vegan', veganOnly, setVeganOnly],
                  ].map(([label, checked, setter]) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setter(e.target.checked)}
                        className="accent-brass"
                      />
                      <span className="font-body text-xs text-cream-dim">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px] text-cream-faint">Bottle price</span>
                    <span className="font-body text-[11px] text-brass">
                      {maxPrice >= PRICE_MAX ? 'Any price' : `Up to $${maxPrice}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max={PRICE_MAX}
                    step="10"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                  />
                  <div className="flex justify-between">
                    <span className="font-body text-[10px] text-cream-faint">$40</span>
                    <span className="font-body text-[10px] text-cream-faint">Any</span>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="eyebrow text-[9px] text-cream-faint hover:text-brass transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Count + sort + view */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="eyebrow text-[9px] text-cream-faint">
          {isLoading && wines.length === 0
            ? 'Loading…'
            : `${filtered.length} wine${filtered.length !== 1 ? 's' : ''}`}
        </span>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card border border-line text-cream font-body text-xs px-3 py-2 focus:outline-none focus:border-brass/50"
          >
            <option value="default">Sort: house order</option>
            <option value="alpha">A → Z</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>

          <div className="flex border border-line">
            {[
              ['list', List],
              ['grid', LayoutGrid],
            ].map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-label={`${mode} view`}
                className={`px-2.5 py-2 transition-colors ${
                  viewMode === mode ? 'bg-brass text-ink' : 'text-cream-faint hover:text-cream'
                }`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading && wines.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-14 bg-card border border-line-soft animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-line-soft bg-card/40">
          <p className="font-display text-2xl text-cream-dim">Nothing matches that</p>
          <p className="font-body text-sm text-cream-faint mt-2">Try loosening a filter.</p>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="mt-5 eyebrow text-[9px] text-brass hover:text-brass-soft transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map((wine) => (
            <WineCard key={wine.id} wine={wine} onSelect={onSelectWine} />
          ))}
        </div>
      ) : (
        <div className="border-y border-line-soft">
          {/* Column header, so the two price columns read as glass / bottle */}
          <div className="flex items-baseline gap-3 py-2 px-1 border-b border-line-soft">
            <span className="w-1 shrink-0" />
            <span className="flex-1 eyebrow text-[8px] text-cream-faint">Wine</span>
            <span className="flex items-baseline gap-3 shrink-0">
              <span className="eyebrow text-[8px] text-cream-faint">Glass</span>
              <span className="eyebrow text-[8px] text-cream-faint w-10 text-right">Btl</span>
            </span>
          </div>

          <div className="divide-y divide-line-soft">
            {filtered.map((wine) => (
              <WineListRow key={wine.id} wine={wine} onSelect={onSelectWine} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WineMenu;
