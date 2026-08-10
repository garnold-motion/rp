// src/config/sheets.js
//
// The venue's master wine list, published to the web as CSV. This IS the admin
// panel — staff edit the Google Sheet, the app picks the change up on the next
// fetch (allow ~15 minutes: Google caches the published CSV for around five,
// and the app caches for ten in the browser).
//
// To re-point this at a different sheet:
//   File → Share → Publish to web → pick the tab → Comma-separated values (.csv)
//   Take everything up to `/pub` as PUBLISHED_BASE, and the gid from the URL.

const PUBLISHED_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ86zmBqK1r39HNMT7F_R-TLDHO0M62AAGSB87uWzzKPQGVH1-XdOiY64U5Zht7wKw6nKuYd1Y3lelt/pub';

// The `Wine List` tab. Pinned explicitly rather than relying on tab order —
// without a gid the export serves whichever sheet happens to be first, so the
// day someone drags a tab to the front the app would quietly serve wrong data.
const WINE_LIST_GID = '377746028';

const buildURL = (gid) =>
  gid
    ? `${PUBLISHED_BASE}?gid=${gid}&single=true&output=csv`
    : `${PUBLISHED_BASE}?output=csv`;

export const SHEET_URLS = {
  wines: buildURL(WINE_LIST_GID),
  // Specials are driven off the `Featured` tick box on the same tab rather than
  // a second sheet, so there's only one place for staff to edit.
  specials: buildURL(WINE_LIST_GID),
};

// Bump the version suffix whenever the sheet's shape changes — it forces every
// phone that has already cached the old data to fetch fresh rather than serve
// a stale copy from localStorage.
export const CACHE_KEYS = {
  wines: 'postman_wines_v3',
  specials: 'postman_specials_v3',
};
