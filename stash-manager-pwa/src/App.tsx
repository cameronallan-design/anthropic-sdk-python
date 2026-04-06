import { useState, useEffect } from 'react';
import StashScreen from './screens/StashScreen';
import StatsScreen from './screens/StatsScreen';

type Tab = 'stash' | 'stats';

const C = {
  bgHeader: '#0d0d1a',
  border: '#1e1e2e',
  textPrimary: '#e8e8f0',
  textMuted: '#555555',
  accent: '#7eb8f7',
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('stash');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showA2HS, setShowA2HS] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay so it doesn't feel jarring
      setTimeout(() => setShowA2HS(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowA2HS(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Desktop sidebar (hidden on mobile via CSS) */}
      <div
        className="side-nav"
        style={{
          display: 'none',
          flexDirection: 'column',
          width: 220,
          backgroundColor: C.bgHeader,
          borderRight: `1px solid ${C.border}`,
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🪖</span>
          <div>
            <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700 }}>Stash Manager</div>
            <div style={{ color: '#333', fontSize: 9, letterSpacing: 1 }}>SCALE PLASTIC</div>
          </div>
        </div>
        <NavBtn active={tab === 'stash'} onClick={() => setTab('stash')} icon="📦" label="My Stash" />
        <NavBtn active={tab === 'stats'} onClick={() => setTab('stats')} icon="📊" label="Dashboard" />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tab === 'stash' ? <StashScreen /> : <StatsScreen />}
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        <button
          className="bottom-nav__tab"
          onClick={() => setTab('stash')}
          aria-current={tab === 'stash' ? 'page' : undefined}
        >
          <span className="bottom-nav__icon">📦</span>
          <span
            className="bottom-nav__label"
            style={{ color: tab === 'stash' ? C.accent : C.textMuted }}
          >
            My Stash
          </span>
        </button>
        <button
          className="bottom-nav__tab"
          onClick={() => setTab('stats')}
          aria-current={tab === 'stats' ? 'page' : undefined}
        >
          <span className="bottom-nav__icon">📊</span>
          <span
            className="bottom-nav__label"
            style={{ color: tab === 'stats' ? C.accent : C.textMuted }}
          >
            Dashboard
          </span>
        </button>
      </nav>

      {/* Add to Home Screen banner */}
      {showA2HS && (
        <div className="a2hs-banner" role="dialog" aria-label="Add to Home Screen">
          <span className="a2hs-banner__icon">🪖</span>
          <div className="a2hs-banner__body">
            <div className="a2hs-banner__title">Add to Home Screen</div>
            <div className="a2hs-banner__sub">Install Stash Manager for offline access</div>
          </div>
          <button className="a2hs-banner__btn" onClick={handleInstall}>Install</button>
          <button
            className="a2hs-banner__close"
            onClick={() => setShowA2HS(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 20px',
        background: active ? '#1a1a2e' : 'none',
        border: 'none',
        borderLeft: `3px solid ${active ? C.accent : 'transparent'}`,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        minHeight: 44,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: active ? C.textPrimary : C.textMuted, fontSize: 14, fontWeight: active ? 600 : 400 }}>
        {label}
      </span>
    </button>
  );
}
