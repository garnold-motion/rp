// src/components/Footer.jsx
import { Home, Grape, Sparkles, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'menu', label: 'Cellar', icon: Grape },
  { key: 'find', label: 'Find', icon: Sparkles },
  { key: 'contact', label: 'Visit', icon: MapPin },
];

const Footer = ({ activeTab, setActiveTab }) => (
  <footer className="fixed bottom-0 left-0 w-full z-[1000] bg-ink-soft/95 backdrop-blur-md border-t border-line-soft pb-[env(safe-area-inset-bottom)]">
    <div
      className="max-w-md mx-auto flex items-stretch"
      style={{ height: 'var(--footer-height)' }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors duration-200 active:scale-95 ${
              isActive ? 'text-brass' : 'text-cream-faint hover:text-cream-dim'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute top-0 h-px w-8 bg-brass"
                style={{ boxShadow: '0 0 12px rgb(201 162 39 / 0.8)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={19} strokeWidth={isActive ? 1.9 : 1.5} />
            <span className="text-[9px] font-medium uppercase tracking-[0.18em]">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </footer>
);

export default Footer;
