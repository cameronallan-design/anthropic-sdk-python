export interface ShopLink {
  name: string;
  url: string;
  price?: string;
}

export interface ShopResult {
  name: string;
  url: string;
  price?: string;
  retailer: string;
}

export interface Kit {
  id: string;
  name: string;
  manufacturer: string;
  scale: string;
  category: string;
  status: string;
  boxNumber: string;
  year: string;
  notes: string;
  boxArtUri: string; // local file URI or remote https:// URL
  shops: ShopLink[];
  addedAt: number;
}

export const CATEGORIES = [
  'Armour',
  'Aircraft',
  'Ships',
  'Figures',
  'Vehicles',
  'Other',
] as const;

export const SCALES = [
  '1/16',
  '1/32',
  '1/35',
  '1/48',
  '1/72',
  '1/76',
  '1/96',
  '1/144',
  '1/200',
  '1/350',
  '1/700',
  'Other',
] as const;

export const STATUSES = [
  'Unbuilt',
  'Wishlist',
  'WIP',
  'Complete',
  'Sold/Donated',
] as const;

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Scale = (typeof SCALES)[number];

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Unbuilt:        { bg: '#1e3a5f', text: '#7eb8f7', dot: '#4a90d9' },
  Wishlist:       { bg: '#3a2a1e', text: '#f7c97e', dot: '#d9924a' },
  WIP:            { bg: '#1e3a2a', text: '#7ef7b8', dot: '#4ad972' },
  Complete:       { bg: '#2a1e3a', text: '#c97ef7', dot: '#924ad9' },
  'Sold/Donated': { bg: '#2a2a2a', text: '#aaaaaa', dot: '#666666' },
};

export const MANUFACTURERS = [
  'Tamiya',
  'Airfix',
  'Italeri',
  'Revell',
  'Trumpeter',
  'Dragon',
  'Eduard',
  'Hasegawa',
  'Fujimi',
  'Academy',
  'Meng',
  'Zvezda',
  'ICM',
  'Bronco',
  'HobbyBoss',
  'Takom',
  'Rye Field Model',
  'Miniart',
  'AFV Club',
  'Fine Molds',
];

export const RETAILERS = [
  { key: 'hannants', label: 'Hannants' },
  { key: 'jadlam',   label: 'Jadlam' },
  { key: 'rapidkit', label: 'Rapid Kit' },
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Armour:   '🪖',
  Aircraft: '✈️',
  Ships:    '🚢',
  Figures:  '🧍',
  Vehicles: '🚗',
  Other:    '📦',
};

export const EMPTY_KIT: Omit<Kit, 'id' | 'addedAt'> = {
  name: '',
  manufacturer: '',
  scale: '1/35',
  category: 'Armour',
  status: 'Unbuilt',
  boxNumber: '',
  year: '',
  notes: '',
  boxArtUri: '',
  shops: [],
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
