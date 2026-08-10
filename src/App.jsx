// src/App.jsx
//
// Single-screen tab shell, no router — the app is opened by scanning a QR at
// the table, so deep links aren't a requirement and a router would only add
// weight and a history stack people don't want on a phone.

import { useState, useEffect, useRef } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import WineMenu from './components/WineMenu';
import FindMyWine from './components/find/FindMyWine';
import Contact from './components/Contact';
import WineDetail from './components/WineDetail';

import { useSheetData } from './hooks/useSheetData';
import { SHEET_URLS, CACHE_KEYS } from './config/sheets';
import { transformWines, transformSpecials } from './data/transforms';
import { prefetchAllSheets } from './data/prefetch';

import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedWine, setSelectedWine] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    prefetchAllSheets();
  }, []);

  // Every tab needs the wine list, so it's fetched once here and passed down
  // rather than re-fetched per tab.
  const {
    data: wines,
    isLoading: isWinesLoading,
    error: winesError,
  } = useSheetData(SHEET_URLS.wines, CACHE_KEYS.wines, transformWines);

  const { data: specials, isLoading: isSpecialsLoading } = useSheetData(
    SHEET_URLS.specials,
    CACHE_KEYS.specials,
    transformSpecials
  );

  // Switching tabs should always land at the top — otherwise you arrive
  // halfway down the cellar because you'd scrolled the previous tab.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <WineMenu
            wines={wines}
            isLoading={isWinesLoading}
            error={winesError}
            onSelectWine={setSelectedWine}
          />
        );
      case 'find':
        return (
          <FindMyWine
            wines={wines}
            isLoading={isWinesLoading}
            onSelectWine={setSelectedWine}
          />
        );
      case 'contact':
        return <Contact specials={specials} isLoading={isSpecialsLoading} />;
      case 'home':
      default:
        return <Home setActiveTab={setActiveTab} specials={specials} />;
    }
  };

  return (
    <div className="app-container">
      <div className="ambient-glow" aria-hidden="true" />

      <Header activeTab={activeTab} />

      <main className="main-content" ref={mainRef}>
        <div className="content-wrapper">{renderTab()}</div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />

      <WineDetail wine={selectedWine} onClose={() => setSelectedWine(null)} />
    </div>
  );
}

export default App;
