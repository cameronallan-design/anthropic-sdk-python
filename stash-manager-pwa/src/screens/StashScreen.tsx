import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kit } from '../types';
import { CATEGORIES, SCALES, STATUSES, EMPTY_KIT } from '../types';
import * as db from '../db';
import { kitsToCSV, csvToKits, downloadCSV } from '../utils/csv';
import KitCard from '../components/KitCard';
import KitForm from '../components/KitForm';

const C = {
  bg: '#0a0a12',
  bgHeader: '#0d0d1a',
  border: '#1e1e2e',
  inputBg: '#0f0f1a',
  inputBorder: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textMuted: '#555555',
  accent: '#7eb8f7',
  green: '#4ad972',
  greenText: '#7ef7b8',
  red: '#f77e7e',
};

const SORT_OPTIONS = ['Recently Added', 'Name A–Z', 'Manufacturer'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function StashScreen() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Partial<Kit> | null>(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  const [filterScale, setFilterScale] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('Recently Added');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    db.getAllKits()
      .then((data) => { setKits(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const saveKit = useCallback(async (kit: Kit) => {
    await db.saveKit(kit);
    setKits((ks) =>
      ks.some((k) => k.id === kit.id)
        ? ks.map((k) => (k.id === kit.id ? kit : k))
        : [kit, ...ks]
    );
    setModal(null);
  }, []);

  const deleteKit = useCallback(async (id: string) => {
    await db.deleteKit(id);
    setKits((ks) => ks.filter((k) => k.id !== id));
  }, []);

  const changeStatus = useCallback(async (id: string, status: string) => {
    setKits((prev) => {
      const kit = prev.find((k) => k.id === id);
      if (!kit) return prev;
      const updated = { ...kit, status };
      db.saveKit(updated).catch(console.error);
      return prev.map((k) => (k.id === id ? updated : k));
    });
  }, []);

  function flash(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  }

  async function handleExport() {
    if (filtered.length === 0) {
      window.alert('No kits match the current filters.');
      return;
    }
    const csv = kitsToCSV(filtered);
    downloadCSV(csv, 'stash-export.csv');
    flash(`Exported ${filtered.length} kit(s).`);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const content = await file.text();
      const imported = csvToKits(content);
      if (imported.length === 0) {
        window.alert('No kits found in that CSV.');
        return;
      }
      if (!window.confirm(`Import ${imported.length} kit(s)? Existing kits with the same ID will be updated.`)) return;
      const updated = await db.bulkImport(imported);
      setKits(updated);
      flash(`Imported ${imported.length} kit(s).`);
    };
    input.click();
  }

  const filtered = useMemo(() => {
    let list = [...kits];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.manufacturer.toLowerCase().includes(q) ||
          k.boxNumber.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All') list = list.filter((k) => k.status === filterStatus);
    if (filterCat    !== 'All') list = list.filter((k) => k.category === filterCat);
    if (filterScale  !== 'All') list = list.filter((k) => k.scale === filterScale);
    if (sortBy === 'Name A–Z')
      list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'Manufacturer')
      list.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
    else
      list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return list;
  }, [kits, search, filterStatus, filterCat, filterScale, sortBy]);

  const selectStyle: React.CSSProperties = {
    backgroundColor: C.inputBg,
    border: `1px solid ${C.inputBorder}`,
    borderRadius: 8,
    padding: '8px 10px',
    color: C.textPrimary,
    fontSize: 12,
    flex: 1,
    minWidth: 0,
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    minHeight: 44,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.bgHeader,
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🪖</span>
          <div>
            <div style={{ color: C.textPrimary, fontSize: 17, fontWeight: 700 }}>Stash Manager</div>
            <div style={{ color: '#333', fontSize: 10, letterSpacing: 1 }}>SCALE PLASTIC</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleImport} style={headerBtnStyle()}>⬆ Import</button>
          <button onClick={handleExport} style={headerBtnStyle('#1a2a1a', C.greenText, C.green + '44')}>⬇ Export</button>
          <button
            onClick={() => setModal({ ...EMPTY_KIT })}
            style={headerBtnStyle('#1a2a3a', C.accent, C.accent + '44')}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Flash bar */}
      {statusMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1a2a1a',
          borderBottom: `1px solid ${C.green}44`,
          padding: '8px 14px',
          flexShrink: 0,
        }}>
          <span style={{ flex: 1, color: C.greenText, fontSize: 13 }}>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} style={{ background: 'none', border: 'none', color: C.green, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search kits…"
          style={{
            backgroundColor: C.inputBg,
            border: `1px solid ${C.inputBorder}`,
            borderRadius: 10,
            padding: '10px 14px',
            color: C.textPrimary,
            fontSize: 14,
            width: '100%',
            boxSizing: 'border-box',
            outline: 'none',
            minHeight: 44,
          }}
        />
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px', flexShrink: 0 }}>
        <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={selectStyle} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="All">All Cat.</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={selectStyle} value={filterScale} onChange={(e) => setFilterScale(e.target.value)}>
          <option value="All">All Scale</option>
          {SCALES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={selectStyle} value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
          {SORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Count */}
      {kits.length > 0 && (
        <div style={{ color: C.textMuted, fontSize: 11, padding: '0 14px 6px', flexShrink: 0 }}>
          {filtered.length} of {kits.length} kit{kits.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 16px' }}>
        {!loaded ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 12 }}>
            <div className="spinner" />
            <span style={{ color: '#555', fontSize: 15 }}>Loading stash…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 12 }}>
            <span style={{ fontSize: 48 }}>📦</span>
            <span style={{ color: '#555', fontSize: 15, textAlign: 'center', lineHeight: '22px' }}>
              {kits.length === 0
                ? 'Your stash is empty.\nTap + Add to add your first kit!'
                : 'No kits match your filters.'}
            </span>
          </div>
        ) : (
          filtered.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              onEdit={(k) => setModal({ ...k })}
              onDelete={deleteKit}
              onStatusChange={changeStatus}
            />
          ))
        )}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <KitForm kit={modal} onSave={saveKit} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function headerBtnStyle(bg = '#1a1a1a', color = '#888', borderColor = '#333'): React.CSSProperties {
  return {
    backgroundColor: bg,
    borderRadius: 7,
    border: `1px solid ${borderColor}`,
    padding: '6px 10px',
    color,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: 44,
  };
}
