import { useState } from 'react';
import type { Kit } from '../types';
import { STATUSES, CATEGORY_ICONS } from '../types';
import StatusBadge from './StatusBadge';

const C = {
  card: '#13131f',
  border: '#1e1e2e',
  inputBg: '#0f0f1a',
  inputBorder: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textMuted: '#555555',
  accent: '#7eb8f7',
  green: '#4ad972',
  greenText: '#7ef7b8',
  red: '#f77e7e',
  redBg: '#2a1515',
};

interface Props {
  kit: Kit;
  onEdit: (kit: Kit) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function KitCard({ kit, onEdit, onDelete, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasArt = !!kit.boxArtUri && !imgError;
  const nextStatuses = STATUSES.filter((s) => s !== kit.status).slice(0, 2);

  function confirmDelete() {
    if (window.confirm(`Remove "${kit.name}" from your stash?`)) {
      onDelete(kit.id);
    }
  }

  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 10,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((x) => !x)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          minHeight: 44,
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          backgroundColor: '#1a1a2e',
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}>
          {hasArt ? (
            <img
              src={kit.boxArtUri}
              alt={kit.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[kit.category] ?? '📦'}</span>
          )}
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: 15,
            color: C.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {kit.name || 'Unnamed Kit'}
          </div>
          <div style={{
            color: C.textMuted,
            fontSize: 12,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {[kit.manufacturer, kit.scale, kit.boxNumber].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* Right: badge + chevron */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <StatusBadge status={kit.status} small />
          <span style={{ color: '#444', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: 14,
          backgroundColor: C.inputBg,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Top: art + meta */}
          <div style={{ display: 'flex', gap: 12 }}>
            {hasArt && (
              <img
                src={kit.boxArtUri}
                alt={kit.name}
                style={{
                  width: 100,
                  height: 75,
                  borderRadius: 6,
                  border: `1px solid ${C.inputBorder}`,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                onError={() => setImgError(true)}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {kit.category && <InfoRow label="Category" value={kit.category} />}
              {kit.year && <InfoRow label="Year" value={kit.year} />}
              {kit.notes && <InfoRow label="Notes" value={kit.notes} />}
            </div>
          </div>

          {/* Shop links */}
          {kit.shops && kit.shops.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Shop Links
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {kit.shops.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #334',
                      borderRadius: 4,
                      padding: '4px 10px',
                      color: C.accent,
                      fontSize: 12,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      minHeight: 44,
                    }}
                  >
                    🛒 {s.name}{s.price ? ` — ${s.price}` : ''}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => onEdit(kit)}
              style={{
                backgroundColor: '#1a2a3a',
                border: `1px solid ${C.accent}33`,
                borderRadius: 6,
                padding: '8px 12px',
                color: C.accent,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              ✏️ Edit
            </button>

            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(kit.id, s)}
                style={{
                  backgroundColor: C.inputBg,
                  border: '1px solid #33334455',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#aaa',
                  fontSize: 12,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                → {s}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            <button
              onClick={confirmDelete}
              style={{
                backgroundColor: C.redBg,
                border: `1px solid ${C.red}33`,
                borderRadius: 6,
                padding: '8px 12px',
                color: C.red,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              🗑 Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      <span style={{ color: '#555', fontSize: 10, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
        {label}:{' '}
      </span>
      <span style={{ color: '#bbb', fontSize: 12 }}>{value}</span>
    </div>
  );
}
