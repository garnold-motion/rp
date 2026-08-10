// src/components/Contact.jsx
//
// Doubles as the CTA tab. The specials board sits above the contact details on
// purpose: someone who has tapped through to "Visit" is already engaged, so
// this is the best moment to point them at a bottle that's open right now.

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, ExternalLink, Star } from 'lucide-react';
import { VENUE } from '../config/venue';

const LABEL_TONES = {
  'Weekly Pick': 'text-brass border-brass/40 bg-brass/10',
  'Limited Release': 'text-claret border-claret/50 bg-claret/10',
  'Staff Favourite': 'text-cream border-line bg-card-lift',
  'New Arrival': 'text-brass-soft border-brass-soft/40 bg-brass-soft/10',
};

const SpecialCard = ({ special, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.4 }}
    className="bg-card border border-line-soft hover:border-brass/40 transition-colors overflow-hidden"
  >
    {special.image_url && (
      <div className="h-36 overflow-hidden">
        <img src={special.image_url} alt="" loading="lazy" className="w-full h-full object-cover opacity-65" />
      </div>
    )}

    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`eyebrow text-[8px] px-2 py-1 border ${
            LABEL_TONES[special.label] ?? LABEL_TONES['Weekly Pick']
          }`}
        >
          {special.label}
        </span>
        {special.category && (
          <span className="font-body text-[10px] text-cream-faint">{special.category}</span>
        )}
      </div>

      <h3 className="font-display text-2xl text-cream leading-tight">{special.title}</h3>

      {special.wine_name && special.wine_name !== special.title && (
        <p className="font-display text-lg italic text-brass mt-0.5">{special.wine_name}</p>
      )}

      {(special.producer || special.vintage || special.region) && (
        <p className="font-body text-[11px] text-cream-faint mt-1.5">
          {[special.producer, special.vintage, special.region, special.country]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {special.description && (
        <p className="font-body text-xs text-cream-dim leading-relaxed mt-3">
          {special.description}
        </p>
      )}

      {special.tasting_notes && (
        <p className="font-display text-base italic text-cream/70 border-l-2 border-brass/30 pl-3 mt-3">
          {special.tasting_notes}
        </p>
      )}

      {(special.price_glass || special.price_bottle) && (
        <div className="flex gap-5 mt-4 pt-3 border-t border-line-soft">
          {special.price_glass && (
            <div>
              <div className="eyebrow text-[8px] text-cream-faint">Glass</div>
              <div className="font-display text-xl text-brass leading-none mt-0.5">
                ${special.price_glass}
              </div>
            </div>
          )}
          {special.price_bottle && (
            <div>
              <div className="eyebrow text-[8px] text-cream-faint">Bottle</div>
              <div className="font-display text-xl text-cream leading-none mt-0.5">
                ${special.price_bottle}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

const ContactRow = ({ icon: Icon, label, value, href, external }) => {
  const Wrapper = href ? 'a' : 'div';
  return (
    <Wrapper
      {...(href ? { href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } : {})}
      className={`flex items-start gap-4 py-4 border-b border-line-soft ${
        href ? 'group cursor-pointer' : ''
      }`}
    >
      <Icon size={15} className="text-brass shrink-0 mt-1" strokeWidth={1.4} />
      <div className="flex-1 min-w-0">
        <div className="eyebrow text-[9px] text-cream-faint mb-1">{label}</div>
        <div className="font-display text-lg text-cream group-hover:text-brass transition-colors leading-snug break-words">
          {value}
        </div>
      </div>
      {external && (
        <ExternalLink size={13} className="text-cream-faint shrink-0 mt-1.5" strokeWidth={1.4} />
      )}
    </Wrapper>
  );
};

const Contact = ({ specials = [], isLoading }) => (
  <div className="max-w-3xl mx-auto px-6 py-12 w-full">
    <div className="mb-10">
      <p className="eyebrow text-brass mb-3">At the bar</p>
      <h1 className="font-display text-5xl md:text-6xl text-cream leading-none mb-3">
        Open Now
      </h1>
      <p className="font-body text-sm text-cream-dim leading-relaxed max-w-sm">
        Limited releases and staff favourites currently open. Ask any of our
        team and we'll pour you a taste.
      </p>
    </div>

    {/* ---- Specials ---- */}
    {isLoading && specials.length === 0 ? (
      <div className="grid sm:grid-cols-2 gap-5 mb-16">
        {[0, 1].map((i) => (
          <div key={i} className="h-56 bg-card border border-line-soft animate-pulse" />
        ))}
      </div>
    ) : specials.length === 0 ? (
      <div className="text-center py-16 border border-line-soft bg-card/40 mb-16">
        <Star size={20} className="text-cream-faint mx-auto mb-4" strokeWidth={1.2} />
        <p className="font-display text-2xl text-cream-dim">Nothing on the board right now</p>
        <p className="font-body text-sm text-cream-faint mt-2">
          We update this weekly — check back soon.
        </p>
      </div>
    ) : (
      <div className="grid sm:grid-cols-2 gap-5 mb-16">
        {specials.map((s, i) => (
          <SpecialCard key={s.id} special={s} index={i} />
        ))}
      </div>
    )}

    {/* ---- Contact ---- */}
    <div className="mb-4">
      <p className="eyebrow text-brass mb-3">Get in touch</p>
      <h2 className="font-display text-4xl text-cream leading-none">Visit Us</h2>
    </div>

    <div className="border-t border-line-soft">
      <ContactRow
        icon={MapPin}
        label="Address"
        value={VENUE.address}
        href={VENUE.mapsUrl}
        external
      />
      <ContactRow icon={Phone} label="Phone" value={VENUE.phone} href={VENUE.phoneHref} />
      <ContactRow icon={Mail} label="Email" value={VENUE.email} href={`mailto:${VENUE.email}`} />
      <div className="flex items-start gap-4 py-4 border-b border-line-soft">
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

    <a
      href={VENUE.website}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 w-full flex items-center justify-center gap-2.5 border border-line py-4 eyebrow text-[9px] text-cream-dim hover:text-brass hover:border-brass/40 transition-colors"
    >
      Book a table
      <ExternalLink size={12} strokeWidth={1.5} />
    </a>
  </div>
);

export default Contact;
