// src/hooks/useSheetData.js
import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function readCache(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'value' in parsed && 'timestamp' in parsed) {
      return parsed;
    }
    return { value: parsed, timestamp: 0 }; // old cache format, predates staleness tracking
  } catch {
    return null;
  }
}

function writeCache(cacheKey, value) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ value, timestamp: Date.now() }));
  } catch (err) {
    console.error(`useSheetData: failed to write cache for "${cacheKey}"`, err);
  }
}

export function isCacheFresh(cacheKey, maxAgeMs = DEFAULT_MAX_AGE_MS) {
  const cached = readCache(cacheKey);
  return !!cached && Date.now() - cached.timestamp < maxAgeMs;
}

/**
 * The published sheet starts with a blank row above the header, so a naive
 * `header: true` parse takes empty strings as the column names and every row
 * comes back as `{"": ...}`. Strip any leading blank lines before parsing.
 */
function stripLeadingBlankLines(chunk) {
  const lines = chunk.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].replace(/[",\s]/g, '') === '') i++;
  return lines.slice(i).join('\n');
}

export function fetchAndCacheSheet(url, cacheKey, transform = (rows) => rows) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      beforeFirstChunk: stripLeadingBlankLines,
      complete: (results) => {
        try {
          const shaped = transform(results.data);
          writeCache(cacheKey, shaped);
          resolve(shaped);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}

export function useSheetData(url, cacheKey, transform = (rows) => rows, options = {}) {
  const { maxAgeMs = DEFAULT_MAX_AGE_MS } = options;
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const [data, setData] = useState(() => readCache(cacheKey)?.value ?? []);
  const [isLoading, setIsLoading] = useState(() => !readCache(cacheKey));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (isCacheFresh(cacheKey, maxAgeMs)) {
      setIsLoading(false);
      return;
    }

    fetchAndCacheSheet(url, cacheKey, transformRef.current)
      .then((shaped) => {
        if (cancelled) return;
        setData(shaped);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`useSheetData: fetch failed for "${cacheKey}"`, err);
        setIsLoading(false);
        setError(err);
      });

    return () => { cancelled = true; };

  }, [url, cacheKey, maxAgeMs]);

  return { data, isLoading, error };
}