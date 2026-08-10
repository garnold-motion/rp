// src/components/Header.jsx
import { motion, AnimatePresence } from 'framer-motion';

const TITLES = {
  home: null, // home shows the full wordmark
  menu: 'The Cellar',
  find: 'Find Your Perfect Wine',
  contact: 'Visit Us',
};

const Header = ({ activeTab }) => {
  const title = TITLES[activeTab];

  return (
    <header className="fixed top-0 left-0 w-full z-[1000] bg-ink-soft/90 backdrop-blur-md border-b border-line-soft">
      <div className="h-15 flex items-center justify-center px-6" style={{ height: 'var(--header-height)' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-center"
          >
            {title ? (
              <span className="eyebrow text-brass">{title}</span>
            ) : (
              <span className="font-display text-xl tracking-[0.12em] text-cream">
                THE RUNNING <span className="text-brass italic">POSTMAN</span>
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
