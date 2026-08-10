// src/config/venue.js
//
// Single source of truth for everything venue-specific. Swapping this file
// (plus config/sheets.js and the theme colours in index.css) is most of what's
// needed to stand the app up for a different client.
//
// TODO: confirm the exact street address and hero image with the venue —
// `address` and `heroImage` below are placeholders.

export const VENUE = {
  name: 'The Running Postman',
  tagline: 'Boutique Wine Bar · Camberwell',

  address: 'Camberwell Road, Camberwell VIC',
  suburb: 'Camberwell, Melbourne',

  phone: '(03) 9889 6988',
  phoneHref: 'tel:+61398896988',

  email: 'info@runningpostmanwinebar.com.au',
  website: 'https://runningpostmanwinebar.com.au',

  mapsUrl: 'https://maps.google.com/?q=Running+Postman+Wine+Bar+Camberwell',

  hours: [
    { days: 'Tue – Fri', time: '3pm til late' },
    { days: 'Saturday', time: '12pm til late' },
    { days: 'Sunday', time: '12pm – 10pm' },
  ],

  happyHour: 'Happy Hour · Tue – Fri · 4pm – 6pm',

  cellarSize: '200+ curated labels',

  // Replace with a photo of the actual room — the timber and the lit wine rack
  // are the venue's strongest visual asset.
  heroImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=80',
};
