/**
 * Vercel serverless function: /api/search
 *
 * Proxies UK scale model retailer search queries so the PWA can search
 * Hannants, Jadlam, and Rapid Kit without CORS issues or on-device scraping.
 *
 * GET /api/search?retailer=hannants&q=tiger+i
 * → { results: ShopResult[], searchUrl: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ShopResult {
  name: string;
  url: string;
  price?: string;
  retailer: string;
}

interface RetailerConfig {
  name: string;
  searchUrl: (q: string) => string;
  parse: (html: string) => ShopResult[];
}

// ── Scrapers ───────────────────────────────────────────────────────────────────

function parseHannants(html: string): ShopResult[] {
  const results: ShopResult[] = [];

  // Extract product links from Hannants search page using regex
  // Hannants uses URLs like /product/TA35216
  const productPattern = /href="(\/(?:product|search)[^"]+)"[^>]*>([^<]{3,80})/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = productPattern.exec(html)) !== null && results.length < 10) {
    const href = match[1];
    const text = match[2].trim().replace(/\s+/g, ' ');
    if (!href || !text || seen.has(href)) continue;
    if (text.length < 5 || /^(search|home|basket|login)/i.test(text)) continue;
    seen.add(href);

    // Look for a nearby price
    const priceMatch = html.slice(Math.max(0, html.indexOf(match[0]) - 100), html.indexOf(match[0]) + 300)
      .match(/£[\d,]+\.?\d{0,2}/);

    results.push({
      name: text,
      url: `https://www.hannants.co.uk${href}`,
      price: priceMatch?.[0],
      retailer: 'Hannants',
    });
  }

  // Fallback: scan for kit-number pattern links
  if (results.length === 0) {
    const kitPattern = /href="([^"]*\/(?:[A-Z]{2,}\d{3,}|product)[^"]*)"[^>]*>([^<]{5,80})/g;
    while ((match = kitPattern.exec(html)) !== null && results.length < 10) {
      const href = match[1];
      const text = match[2].trim();
      if (seen.has(href)) continue;
      seen.add(href);
      results.push({
        name: text,
        url: href.startsWith('http') ? href : `https://www.hannants.co.uk${href}`,
        retailer: 'Hannants',
      });
    }
  }

  return results;
}

function parseJadlam(html: string): ShopResult[] {
  const results: ShopResult[] = [];
  const seen = new Set<string>();

  // Jadlam is a Shopify store — products are at /products/...
  const productPattern = /href="(\/products\/[^"?#]+)"[^>]*>([\s\S]{0,200}?)<\/a/g;
  let match: RegExpExecArray | null;

  while ((match = productPattern.exec(html)) !== null && results.length < 10) {
    const href = match[1];
    if (seen.has(href)) continue;
    seen.add(href);

    const innerHtml = match[2];
    // Strip HTML tags to get text
    const text = innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || text.length < 5) continue;

    const priceMatch = innerHtml.match(/£[\d,]+\.?\d{0,2}/);

    results.push({
      name: text.slice(0, 100),
      url: `https://www.jadlamracingmodels.com${href}`,
      price: priceMatch?.[0],
      retailer: 'Jadlam',
    });
  }

  return results;
}

function parseRapidKit(html: string): ShopResult[] {
  const results: ShopResult[] = [];
  const seen = new Set<string>();

  // RapidKit is Magento-based — products end in .html
  const productPattern = /href="(https?:\/\/www\.rapidkit\.co\.uk\/[^"]+\.html)"[^>]*>([^<]{5,100})/g;
  let match: RegExpExecArray | null;

  while ((match = productPattern.exec(html)) !== null && results.length < 10) {
    const href = match[1];
    const text = match[2].trim();
    if (seen.has(href) || !text) continue;
    seen.add(href);

    const section = html.slice(html.indexOf(match[0]), html.indexOf(match[0]) + 400);
    const priceMatch = section.match(/£[\d,]+\.?\d{0,2}/);

    results.push({
      name: text,
      url: href,
      price: priceMatch?.[0],
      retailer: 'Rapid Kit',
    });
  }

  return results;
}

// ── Retailer configs ───────────────────────────────────────────────────────────

const RETAILERS: Record<string, RetailerConfig> = {
  hannants: {
    name: 'Hannants',
    searchUrl: (q) => `https://www.hannants.co.uk/search/?query=${encodeURIComponent(q)}`,
    parse: parseHannants,
  },
  jadlam: {
    name: 'Jadlam',
    searchUrl: (q) =>
      `https://www.jadlamracingmodels.com/search?q=${encodeURIComponent(q)}&options%5Bprefix%5D=last`,
    parse: parseJadlam,
  },
  rapidkit: {
    name: 'Rapid Kit',
    searchUrl: (q) => `https://www.rapidkit.co.uk/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    parse: parseRapidKit,
  },
};

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed', results: [] });
    return;
  }

  const retailerKey = String(req.query.retailer ?? '').toLowerCase();
  const query       = String(req.query.q ?? '').trim();

  if (!query) {
    res.status(400).json({ error: 'Missing query parameter q', results: [] });
    return;
  }

  const retailer = RETAILERS[retailerKey];
  if (!retailer) {
    res.status(400).json({
      error: `Unknown retailer "${retailerKey}". Valid: ${Object.keys(RETAILERS).join(', ')}`,
      results: [],
    });
    return;
  }

  const searchUrl = retailer.searchUrl(query);

  try {
    const fetchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!fetchRes.ok) {
      res.status(200).json({ results: [], searchUrl, error: `HTTP ${fetchRes.status}` });
      return;
    }

    const html = await fetchRes.text();
    const results = retailer.parse(html);
    res.status(200).json({ results, searchUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(200).json({ results: [], searchUrl, error: msg });
  }
}
