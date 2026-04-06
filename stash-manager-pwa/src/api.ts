import type { ShopResult } from './types';

export interface SearchResponse {
  results: ShopResult[];
  searchUrl?: string;
  error?: string;
}

export async function searchShop(
  retailer: string,
  query: string
): Promise<SearchResponse> {
  const url = `/api/search?retailer=${encodeURIComponent(retailer)}&q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return { results: [], error: `Server error: HTTP ${res.status}` };
    }
    return (await res.json()) as SearchResponse;
  } catch (err: unknown) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    return { results: [], error: msg };
  }
}
