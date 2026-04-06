/**
 * Calls the remote shop-search Express API.
 * The API lives in /shop-api and should be deployed to Railway or Render.
 */
import { ShopResult } from './types';
import { SHOP_API_BASE_URL } from './config';

export interface SearchResponse {
  results: ShopResult[];
  searchUrl?: string;
  error?: string;
}

export async function searchShop(
  retailer: string,
  query: string
): Promise<SearchResponse> {
  const url = `${SHOP_API_BASE_URL}/search?retailer=${encodeURIComponent(
    retailer
  )}&q=${encodeURIComponent(query)}`;

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
