// src/data/prefetch.js
import { fetchAndCacheSheet, isCacheFresh } from '../hooks/useSheetData';
import { SHEET_URLS, CACHE_KEYS } from '../config/sheets';
import { transformSpecials } from './transforms';

const PREFETCH_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

// Wines are fetched by App on mount because every tab needs them. Specials are
// only rendered on Home and Contact, so warm them here — in-venue wifi is
// often slow enough that the round trip is noticeable if we wait for the tap.
const PREFETCH_TARGETS = [
  { url: SHEET_URLS.specials, cacheKey: CACHE_KEYS.specials, transform: transformSpecials },
];

export function prefetchAllSheets() {
  PREFETCH_TARGETS.forEach(({ url, cacheKey, transform }) => {
    if (!isCacheFresh(cacheKey, PREFETCH_MAX_AGE_MS)) {
      fetchAndCacheSheet(url, cacheKey, transform).catch((err) => {
        console.error(`prefetchAllSheets: failed for "${cacheKey}"`, err);
      });
    }
  });
}
