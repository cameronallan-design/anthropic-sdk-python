import type { Kit } from '../types';

const CSV_HEADERS = [
  'id',
  'name',
  'manufacturer',
  'scale',
  'category',
  'status',
  'boxNumber',
  'year',
  'notes',
  'boxArtUri',
  'shops',
  'addedAt',
] as const;

function escapeCell(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function kitsToCSV(kits: Kit[]): string {
  const lines: string[] = [CSV_HEADERS.join(',')];
  for (const kit of kits) {
    const row = CSV_HEADERS.map((h) => {
      if (h === 'shops') return escapeCell(JSON.stringify(kit.shops ?? []));
      if (h === 'boxArtUri') {
        const uri = kit.boxArtUri ?? '';
        return escapeCell(uri.startsWith('http') ? uri : '[local image]');
      }
      return escapeCell(kit[h as keyof Kit]);
    });
    lines.push(row.join(','));
  }
  return lines.join('\r\n');
}

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cells.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

const STATUS_MAP: Record<string, string> = {
  'in stash': 'Unbuilt',
  stash: 'Unbuilt',
  unbuilt: 'Unbuilt',
  wishlist: 'Wishlist',
  'wish list': 'Wishlist',
  'on the go': 'WIP',
  wip: 'WIP',
  'work in progress': 'WIP',
  built: 'Complete',
  complete: 'Complete',
  completed: 'Complete',
  finished: 'Complete',
  'sold/donated': 'Sold/Donated',
  sold: 'Sold/Donated',
  donated: 'Sold/Donated',
};

const VALID_SCALES = [
  '1/16','1/32','1/35','1/48','1/72','1/76','1/96','1/144','1/200','1/350','1/700',
];

export function csvToKits(content: string): Kit[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const idx = headers.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxName     = col('name', 'kit name', 'title', 'model');
  const idxBrand    = col('manufacturer', 'brand', 'maker');
  const idxScale    = col('scale');
  const idxNumber   = col('boxnumber', 'box number', 'kit number', 'number', 'ref');
  const idxCategory = col('category', 'type', 'subject');
  const idxStatus   = col('status', 'state');
  const idxYear     = col('year', 'released');
  const idxNotes    = col('notes', 'comment', 'comments', 'remarks');
  const idxShops    = col('shops');
  const idxId       = col('id');

  const kits: Kit[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.every((c) => !c.trim())) continue;

    const get = (idx: number) => (idx >= 0 ? (row[idx] ?? '').trim() : '');

    const rawStatus = get(idxStatus).toLowerCase();
    const status = STATUS_MAP[rawStatus] ?? 'Unbuilt';
    const rawScale = get(idxScale);
    const scale = VALID_SCALES.includes(rawScale) ? rawScale : '1/35';

    let shops: Kit['shops'] = [];
    const shopsRaw = get(idxShops);
    if (shopsRaw) {
      try { shops = JSON.parse(shopsRaw); } catch (_) { /* ignore */ }
    }

    kits.push({
      id: get(idxId) || Date.now().toString(36) + Math.random().toString(36).slice(2) + i,
      name: get(idxName) || `Imported Kit ${i}`,
      manufacturer: get(idxBrand),
      scale,
      category: get(idxCategory) || 'Other',
      status,
      boxNumber: get(idxNumber),
      year: get(idxYear),
      notes: get(idxNotes),
      boxArtUri: '',
      shops,
      addedAt: Date.now() + i,
    });
  }
  return kits;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
