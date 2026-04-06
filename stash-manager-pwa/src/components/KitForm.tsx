import { useState, useRef } from 'react';
import type { Kit, ShopLink, ShopResult } from '../types';
import {
  CATEGORIES,
  SCALES,
  STATUSES,
  MANUFACTURERS,
  RETAILERS,
  EMPTY_KIT,
  generateId,
} from '../types';
import { searchShop } from '../api';

const C = {
  bg: '#0a0a12',
  bgHeader: '#0d0d1a',
  border: '#1e1e2e',
  inputBg: '#0f0f1a',
  inputBorder: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textSecondary: '#aaaaaa',
  textMuted: '#555555',
  accent: '#7eb8f7',
  accentDim: '#4a90d9',
  green: '#4ad972',
  greenText: '#7ef7b8',
  red: '#f77e7e',
  redBg: '#2a1515',
};

interface Props {
  kit: Partial<Kit>;
  onSave: (kit: Kit) => void;
  onClose: () => void;
}

export default function KitForm({ kit, onSave, onClose }: Props) {
  const [form, setForm] = useState<Kit>({
    ...(EMPTY_KIT as Kit),
    ...kit,
    id: kit.id ?? '',
    addedAt: kit.addedAt ?? Date.now(),
    shops: kit.shops ?? [],
    boxArtUri: kit.boxArtUri ?? '',
  });

  const set = <K extends keyof Kit>(k: K, v: Kit[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Box art ────────────────────────────────────────────────────────────────

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') set('boxArtUri', result);
    };
    reader.readAsDataURL(file);
  }

  // ── Shop links ─────────────────────────────────────────────────────────────

  const [shopInput, setShopInput] = useState<ShopLink>({ name: '', url: '', price: '' });
  const [shopError, setShopError] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  function addShopManual() {
    if (!shopInput.name.trim() || !shopInput.url.trim()) {
      setShopError('Shop name and URL are required');
      return;
    }
    setForm((f) => ({ ...f, shops: [...(f.shops ?? []), { ...shopInput }] }));
    setShopInput({ name: '', url: '', price: '' });
    setShopError('');
  }

  function removeShop(i: number) {
    setForm((f) => ({ ...f, shops: f.shops.filter((_, idx) => idx !== i) }));
  }

  function addShopFromSearch(shop: ShopLink) {
    setForm((f) => ({ ...f, shops: [...(f.shops ?? []), shop] }));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!form.name.trim()) return;
    const saved: Kit = form.id
      ? form
      : { ...form, id: generateId(), addedAt: Date.now() };
    onSave(saved);
  }

  const isValid = form.name.trim().length > 0;

  const inputStyle: React.CSSProperties = {
    backgroundColor: C.inputBg,
    border: `1px solid ${C.inputBorder}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: C.textPrimary,
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: 44,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M6 8L0 0h12z' fill='%23555'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '10px',
    paddingRight: 32,
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    color: C.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: 4,
    marginTop: 10,
    display: 'block',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflowY: 'auto',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px 12px',
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.bgHeader,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: C.accent, fontSize: 16, cursor: 'pointer', padding: '4px 8px', minHeight: 44 }}
        >
          Cancel
        </button>
        <span style={{ color: C.textPrimary, fontSize: 17, fontWeight: 700 }}>
          {form.id ? 'Edit Kit' : 'Add Kit'}
        </span>
        <button
          onClick={handleSave}
          disabled={!isValid}
          style={{
            backgroundColor: isValid ? '#1a3a5f' : '#111',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: isValid ? C.accent : '#444',
            fontWeight: 700,
            fontSize: 15,
            cursor: isValid ? 'pointer' : 'default',
            minHeight: 44,
          }}
        >
          {form.id ? 'Save' : 'Add'}
        </button>
      </div>

      {/* Scroll content */}
      <div style={{ padding: 16, maxWidth: 640, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Kit Name */}
        <label style={labelStyle}>Kit Name *</label>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Tiger I Early Production"
          autoFocus
        />

        {/* Manufacturer */}
        <label style={labelStyle}>Manufacturer</label>
        <input
          style={inputStyle}
          value={form.manufacturer}
          onChange={(e) => set('manufacturer', e.target.value)}
          placeholder="e.g. Tamiya"
          list="manufacturers-list"
        />
        <datalist id="manufacturers-list">
          {MANUFACTURERS.map((m) => <option key={m} value={m} />)}
        </datalist>

        {/* Box Number */}
        <label style={labelStyle}>Box / Kit No.</label>
        <input
          style={inputStyle}
          value={form.boxNumber}
          onChange={(e) => set('boxNumber', e.target.value)}
          placeholder="e.g. 35216"
        />

        {/* Scale + Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Scale</label>
            <select style={selectStyle} value={form.scale} onChange={(e) => set('scale', e.target.value)}>
              {SCALES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={selectStyle} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Status */}
        <label style={labelStyle}>Status</label>
        <select style={selectStyle} value={form.status} onChange={(e) => set('status', e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Year */}
        <label style={labelStyle}>Year Released</label>
        <input
          style={inputStyle}
          type="number"
          value={form.year}
          onChange={(e) => set('year', e.target.value)}
          placeholder="e.g. 1998"
          min="1950"
          max="2030"
        />

        {/* Notes */}
        <label style={labelStyle}>Notes</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Paint scheme, aftermarket refs, etc."
        />

        {/* Box Art */}
        <div style={{ height: 1, backgroundColor: C.border, margin: '20px 0' }} />
        <div style={{ color: C.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          Box Art
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 80,
            height: 60,
            borderRadius: 6,
            border: `1px solid ${C.inputBorder}`,
            backgroundColor: C.inputBg,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {form.boxArtUri ? (
              <img
                src={form.boxArtUri}
                alt="Box art"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => set('boxArtUri', '')}
              />
            ) : (
              <span style={{ fontSize: 24 }}>🖼</span>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              style={{ ...inputStyle, fontSize: 12 }}
              value={form.boxArtUri?.startsWith('http') ? form.boxArtUri : ''}
              onChange={(e) => set('boxArtUri', e.target.value)}
              placeholder="Paste image URL…"
              type="url"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: '#1a2a3a',
                  border: `1px solid ${C.accent}33`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: C.accent,
                  fontSize: 12,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                📁 Pick Photo
              </button>
              {form.boxArtUri && (
                <button
                  onClick={() => set('boxArtUri', '')}
                  style={{
                    backgroundColor: C.redBg,
                    border: `1px solid ${C.red}33`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: C.red,
                    fontSize: 12,
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePick}
        />

        {/* Shop Links */}
        <div style={{ height: 1, backgroundColor: C.border, margin: '20px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ color: C.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Shop Links
          </div>
          <button
            onClick={() => setShowSearch((x) => !x)}
            style={{
              backgroundColor: showSearch ? '#1a3a5f' : '#111',
              border: `1px solid ${showSearch ? C.accentDim + '44' : '#444'}`,
              borderRadius: 6,
              padding: '6px 10px',
              color: showSearch ? C.accent : '#666',
              fontSize: 11,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            🔍 Search Retailers
          </button>
        </div>

        {/* Existing links */}
        {(form.shops ?? []).map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: C.inputBg,
              borderRadius: 6,
              padding: '8px 10px',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ flex: 1, color: C.accent, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🛒 {s.name}{s.price ? ` — ${s.price}` : ''}
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.textMuted, fontSize: 14, textDecoration: 'none', padding: '4px 6px', minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              ↗
            </a>
            <button
              onClick={() => removeShop(i)}
              style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 16, cursor: 'pointer', padding: '4px 6px', minHeight: 44 }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Manual add row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 0.7fr', gap: 6, marginTop: 6 }}>
          <input
            style={inputStyle}
            value={shopInput.name}
            onChange={(e) => setShopInput((s) => ({ ...s, name: e.target.value }))}
            placeholder="Shop name"
          />
          <input
            style={inputStyle}
            value={shopInput.url}
            onChange={(e) => setShopInput((s) => ({ ...s, url: e.target.value }))}
            placeholder="https://…"
            type="url"
          />
          <input
            style={inputStyle}
            value={shopInput.price ?? ''}
            onChange={(e) => setShopInput((s) => ({ ...s, price: e.target.value }))}
            placeholder="£ price"
          />
        </div>
        {shopError && <div style={{ color: C.red, fontSize: 12, marginTop: 4 }}>{shopError}</div>}
        <button
          onClick={addShopManual}
          style={{
            backgroundColor: '#1a2a1a',
            border: `1px solid ${C.greenText}33`,
            borderRadius: 6,
            padding: '10px',
            color: C.greenText,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            marginTop: 8,
            minHeight: 44,
          }}
        >
          + Add Shop Link Manually
        </button>

        {/* Retailer search panel */}
        {showSearch && (
          <ShopSearchPanel kitName={form.name} onAdd={addShopFromSearch} />
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ── Shop search panel ──────────────────────────────────────────────────────────

function ShopSearchPanel({ kitName, onAdd }: { kitName: string; onAdd: (shop: ShopLink) => void }) {
  const [retailer, setRetailer] = useState(RETAILERS[0].key);
  const [query, setQuery] = useState(kitName);
  const [results, setResults] = useState<ShopResult[]>([]);
  const [searchUrl, setSearchUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSearchUrl('');
    try {
      const res = await searchShop(retailer, query.trim());
      setResults(res.results);
      setSearchUrl(res.searchUrl ?? '');
      if (res.error) setError(`Note: ${res.error}`);
    } finally {
      setLoading(false);
    }
  }

  const C2 = {
    bg: '#0a0a14',
    border: '#2a2a3a',
    inputBg: '#0f0f1a',
    textPrimary: '#e8e8f0',
    textMuted: '#555',
    accent: '#7eb8f7',
    accentDim: '#4a90d9',
    green: '#4ad972',
    greenText: '#7ef7b8',
  };

  return (
    <div style={{
      backgroundColor: C2.bg,
      border: `1px solid ${C2.border}`,
      borderRadius: 10,
      padding: 14,
      marginTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ color: C2.textMuted, fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
        Search UK Retailers
      </div>

      {/* Retailer tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {RETAILERS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRetailer(r.key)}
            style={{
              backgroundColor: retailer === r.key ? '#1a3a5f' : '#111',
              border: `1px solid ${retailer === r.key ? C2.accentDim + '44' : '#333'}`,
              borderRadius: 6,
              padding: '6px 10px',
              color: retailer === r.key ? C2.accent : '#555',
              fontSize: 12,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          style={{
            flex: 1,
            backgroundColor: C2.inputBg,
            border: `1px solid ${C2.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            color: C2.textPrimary,
            fontSize: 14,
            outline: 'none',
            minHeight: 44,
          }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          placeholder="Search term…"
        />
        <button
          onClick={doSearch}
          disabled={loading}
          style={{
            backgroundColor: '#1a3a5f',
            border: 'none',
            borderRadius: 6,
            padding: '10px 16px',
            color: C2.accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            minHeight: 44,
            minWidth: 72,
          }}
        >
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {error && <div style={{ color: '#f7c97e', fontSize: 11 }}>{error}</div>}

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#111',
            borderRadius: 6,
            padding: 8,
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C2.textPrimary, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.name}
            </div>
            {r.price && <div style={{ color: C2.green, fontSize: 11, marginTop: 2 }}>{r.price}</div>}
          </div>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C2.textMuted, fontSize: 14, textDecoration: 'none', padding: '4px 6px', minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            ↗
          </a>
          <button
            onClick={() => onAdd({ name: r.retailer, url: r.url, price: r.price })}
            style={{
              backgroundColor: '#1a2a1a',
              border: `1px solid ${C2.greenText}33`,
              borderRadius: 5,
              padding: '6px 10px',
              color: C2.greenText,
              fontSize: 12,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            + Add
          </button>
        </div>
      ))}

      {results.length === 0 && !loading && searchUrl && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C2.accent, fontSize: 12, marginTop: 6 }}
        >
          No results — open in browser ↗
        </a>
      )}
    </div>
  );
}
