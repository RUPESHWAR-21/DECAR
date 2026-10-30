import { useCallback, useEffect, useState } from 'react';
import Icon from './components/Icon';
import LiveView from './components/LiveView';
import AnalyzeView from './components/AnalyzeView';
import HistoryView from './components/HistoryView';
import { getDbStatus } from './api';
import './App.css';

const VIEWS = [
  { id: 'live', label: 'Live' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'history', label: 'History' },
];

const THEMES = [
  { id: 'light', icon: 'sun', label: 'Light theme' },
  { id: 'dark', icon: 'moon', label: 'Dark theme' },
  { id: 'contrast', icon: 'contrast', label: 'High-contrast theme' },
];

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function initialTheme() {
  const stored = readStored('obd-theme', null);
  if (stored) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [view, setView] = useState(() => readStored('obd-view', 'live'));
  const [theme, setTheme] = useState(initialTheme);
  const [db, setDb] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStored('obd-theme', theme);
  }, [theme]);

  useEffect(() => writeStored('obd-view', view), [view]);

  const refreshDb = useCallback(() => {
    getDbStatus()
      .then(setDb)
      .catch((err) => setDb({ connected: false, error: `Backend unreachable: ${err.message}` }));
  }, []);

  useEffect(() => {
    refreshDb();
    const id = setInterval(refreshDb, 30000);
    return () => clearInterval(id);
  }, [refreshDb]);

  return (
    <div className="shell">
      <div className="page">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">OBD.</span>
            <span className="brand-sub">
              Diagnostics
              <br />
              Center
            </span>
          </div>

          <nav className="nav" aria-label="Views">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={`pill ${view === v.id ? 'is-active' : ''}`}
                aria-current={view === v.id ? 'page' : undefined}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </nav>

          <div className="topbar-end">
            <button
              className={`db-chip ${db?.connected ? 'is-ok' : db ? 'is-off' : ''}`}
              onClick={refreshDb}
              title={db?.error || 'Supabase connected'}
            >
              <Icon name="database" size={16} />
              <span>{db ? (db.connected ? 'Supabase' : 'Database offline') : 'Checking…'}</span>
              <span className="dot" />
            </button>
            <div className="theme-switch" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={theme === t.id}
                  aria-label={t.label}
                  title={t.label}
                  className={`round-btn sm ${theme === t.id ? 'is-active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  <Icon name={t.icon} size={16} />
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="main">
          {view === 'live' && <LiveView />}
          {view === 'analyze' && <AnalyzeView onSaved={refreshDb} />}
          {view === 'history' && <HistoryView db={db} onRetry={refreshDb} />}
        </main>
      </div>
    </div>
  );
}
