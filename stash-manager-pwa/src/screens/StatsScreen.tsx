import { useEffect, useState, useMemo } from 'react';
import type { Kit } from '../types';
import { STATUS_COLORS, CATEGORIES, STATUSES } from '../types';
import * as db from '../db';

const C = {
  bg: '#0a0a12',
  bgHeader: '#0d0d1a',
  card: '#13131f',
  border: '#1e1e2e',
  textPrimary: '#e8e8f0',
  textMuted: '#555555',
  accent: '#7eb8f7',
};

export default function StatsScreen() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getAllKits()
      .then((data) => { setKits(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byScale: Record<string, number> = {};
    const byManufacturer: Record<string, number> = {};

    for (const k of kits) {
      byStatus[k.status]              = (byStatus[k.status]              ?? 0) + 1;
      byCategory[k.category]          = (byCategory[k.category]          ?? 0) + 1;
      byScale[k.scale]                = (byScale[k.scale]                ?? 0) + 1;
      byManufacturer[k.manufacturer]  = (byManufacturer[k.manufacturer]  ?? 0) + 1;
    }

    const topManufacturers = Object.entries(byManufacturer)
      .filter(([m]) => m.trim())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topScales = Object.entries(byScale)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { byStatus, byCategory, topManufacturers, topScales };
  }, [kits]);

  if (!loaded) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: 16, maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Header */}
        <div style={{
          backgroundColor: C.bgHeader,
          borderRadius: 10,
          padding: 16,
          marginBottom: 8,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>📊 Dashboard</div>
          <div style={{ color: '#333', fontSize: 10, letterSpacing: '1.2px', marginTop: 2, textTransform: 'uppercase' }}>
            Stash Statistics
          </div>
        </div>

        {/* Total */}
        <div style={{
          backgroundColor: C.card,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 4,
        }}>
          <div style={{ color: C.textPrimary, fontSize: 52, fontWeight: 800, lineHeight: '58px' }}>
            {kits.length}
          </div>
          <div style={{ color: C.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
            Total Kits
          </div>
        </div>

        {/* By Status */}
        <SectionTitle>By Status</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {STATUSES.map((s) => {
            const count = stats.byStatus[s] ?? 0;
            const c = STATUS_COLORS[s];
            const pct = kits.length > 0 ? count / kits.length : 0;
            return (
              <div
                key={s}
                style={{
                  backgroundColor: c.bg,
                  border: `1px solid ${c.dot}44`,
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.dot }} />
                  <span style={{ color: c.text, fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    {s}
                  </span>
                </div>
                <div style={{ color: c.text, fontSize: 28, fontWeight: 800, lineHeight: '32px' }}>{count}</div>
                <div style={{ height: 3, backgroundColor: '#00000033', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: 3, width: `${Math.round(pct * 100)}%`, backgroundColor: c.dot, borderRadius: 2 }} />
                </div>
                <div style={{ color: c.dot, fontSize: 10, fontWeight: 600 }}>
                  {kits.length > 0 ? `${Math.round(pct * 100)}%` : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* By Category */}
        <SectionTitle>By Category</SectionTitle>
        {CATEGORIES.map((cat) => {
          const count = stats.byCategory[cat] ?? 0;
          if (count === 0) return null;
          return (
            <BarRow key={cat} label={cat} count={count} pct={kits.length > 0 ? count / kits.length : 0} color={C.accent} />
          );
        })}

        {/* Top Manufacturers */}
        {stats.topManufacturers.length > 0 && (
          <>
            <SectionTitle>Top Manufacturers</SectionTitle>
            {stats.topManufacturers.map(([name, count]) => (
              <BarRow
                key={name}
                label={name || 'Unknown'}
                count={count}
                pct={kits.length > 0 ? count / kits.length : 0}
                color="#d9924a"
              />
            ))}
          </>
        )}

        {/* Popular Scales */}
        {stats.topScales.length > 0 && (
          <>
            <SectionTitle>Popular Scales</SectionTitle>
            {stats.topScales.map(([scale, count]) => (
              <BarRow
                key={scale}
                label={scale}
                count={count}
                pct={kits.length > 0 ? count / kits.length : 0}
                color="#924ad9"
              />
            ))}
          </>
        )}

        {kits.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <span style={{ fontSize: 48 }}>📦</span>
            <span style={{ color: '#555', fontSize: 14, textAlign: 'center', lineHeight: '22px' }}>
              Add kits to your stash to see statistics here.
            </span>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{
      color: '#555',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      marginTop: 16,
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function BarRow({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#13131f',
      borderRadius: 8,
      border: '1px solid #1e1e2e',
      padding: '10px 12px',
      gap: 10,
      marginBottom: 4,
    }}>
      <span style={{ color: '#e8e8f0', fontSize: 13, minWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 4, backgroundColor: '#1e1e2e', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: 4, width: `${Math.max(2, Math.round(pct * 100))}%`, backgroundColor: color, borderRadius: 2 }} />
      </div>
      <span style={{ color, fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{count}</span>
    </div>
  );
}
