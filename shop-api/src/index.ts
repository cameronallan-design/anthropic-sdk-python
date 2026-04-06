/**
 * Stash Manager — Shop Search API
 *
 * A small Express server that scrapes UK scale model retailers so the
 * iOS app can search them without violating App Store rules about on-device
 * scraping.
 *
 * Deploy to Render (render.yaml) or Railway (railway.json) — see repo root.
 * Set SHOP_API_URL in the Expo app's .env or app.json extra to point here.
 *
 * GET /search?retailer=hannants&q=tiger+i
 * → { results: ShopResult[], searchUrl: string }
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Retailer configs ───────────────────────────────────────────────────────────

const RETAILERS: Record<string, RetailerConfig> = {
  hannants: {
    name: 'Hannants',
    searchUrl: (q) =>
      `https://www.hannants.co.uk/search/?query=${encodeURIComponent(q)}`,
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
    searchUrl: (q) =>
      `https://www.rapidkit.co.uk/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    parse: parseRapidKit,
  },
};

// ── Scrapers ───────────────────────────────────────────────────────────────────

function parseHannants(html: string): ShopResult[] {
  const $ = cheerio.load(html);
  const results: ShopResult[] = [];

  const selectors = ['.listing-product', '.product-item', '.search-result', 'article'];
  let container: string | null = null;
  for (const sel of selectors) {
    if ($(sel).length > 0) { container = sel; break; }
  }

  if (!container) {
    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (href.includes('/product') || href.includes('/kit') || /\/[A-Z]\d{4,}/.test(href)) {
        results.push({
          name: text || href,
          url: href.startsWith('http') ? href : `https://www.hannants.co.uk${href}`,
          price: '',
          retailer: 'Hannants',
        });
      }
      return results.length < 10;
    });
    return results;
  }

  $(container).each((_i, el) => {
    const $el = $(el);
    const linkEl = $el.find('a[href]').first();
    const href = linkEl.attr('href') ?? '';
    const name =
      $el.find('.product-name, .title, h2, h3, h4').first().text().trim() ||
      linkEl.text().trim();
    const price = $el.find('.price, .product-price, [class*=price]').first().text().trim();

    if (name && href) {
      results.push({
        name,
        url: href.startsWith('http') ? href : `https://www.hannants.co.uk${href}`,
        price: price.replace(/\s+/g, ' '),
        retailer: 'Hannants',
      });
    }
    return results.length < 10;
  });

  return results;
}

function parseJadlam(html: string): ShopResult[] {
  const $ = cheerio.load(html);
  const results: ShopResult[] = [];

  const selectors = ['.product-item', '.grid__item', '[data-product-id]', '.product-card'];
  let container: string | null = null;
  for (const sel of selectors) {
    if ($(sel).length > 0) { container = sel; break; }
  }

  const addItem = (_i: number, el: cheerio.Element) => {
    const $el = $(el);
    const linkEl = $el.find('a[href]').first();
    const href = linkEl.attr('href') ?? '';
    const name =
      $el.find('.product-item__title, .card__heading, h3, h4').first().text().trim() ||
      linkEl.text().trim();
    const price = $el.find('.price, .product-price, .money').first().text().trim();
    if (name && href) {
      results.push({
        name,
        url: href.startsWith('http') ? href : `https://www.jadlamracingmodels.com${href}`,
        price: price.replace(/\s+/g, ' '),
        retailer: 'Jadlam',
      });
    }
    return results.length < 10;
  };

  if (container) {
    $(container).each(addItem);
  } else {
    $("a[href*='/products/']").each((_i, el) => {
      const $el = $(el);
      const href = $el.attr('href') ?? '';
      const name = $el.text().trim();
      if (name && href) {
        results.push({
          name,
          url: href.startsWith('http') ? href : `https://www.jadlamracingmodels.com${href}`,
          price: '',
          retailer: 'Jadlam',
        });
      }
      return results.length < 10;
    });
  }

  return results;
}

function parseRapidKit(html: string): ShopResult[] {
  const $ = cheerio.load(html);
  const results: ShopResult[] = [];

  const selectors = ['.product-item', '.item.product', '.product', '.search-results .item'];
  let container: string | null = null;
  for (const sel of selectors) {
    if ($(sel).length > 0) { container = sel; break; }
  }

  const addItem = (_i: number, el: cheerio.Element) => {
    const $el = $(el);
    const linkEl = $el.find('a[href]').first();
    const href = linkEl.attr('href') ?? '';
    const name =
      $el.find('.product-item-name, .product-name, h2, h3').first().text().trim() ||
      linkEl.text().trim();
    const price = $el.find('.price, .price-box, [class*=price]').first().text().trim();
    if (name && href) {
      results.push({
        name,
        url: href.startsWith('http') ? href : `https://www.rapidkit.co.uk${href}`,
        price: price.replace(/\s+/g, ' '),
        retailer: 'Rapid Kit',
      });
    }
    return results.length < 10;
  };

  if (container) {
    $(container).each(addItem);
  } else {
    $('a[href]').each((_i, el) => {
      const $el = $(el);
      const href = $el.attr('href') ?? '';
      if (href.includes('.html') || href.includes('/product')) {
        const name = $el.text().trim();
        if (name) {
          results.push({
            name,
            url: href.startsWith('http') ? href : `https://www.rapidkit.co.uk${href}`,
            price: '',
            retailer: 'Rapid Kit',
          });
        }
      }
      return results.length < 10;
    });
  }

  return results;
}

// ── Express app ────────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'stash-shop-api' });
});

// Search endpoint
app.get('/search', async (req: Request, res: Response) => {
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
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      // @ts-ignore — node-fetch v2 timeout option
      timeout: 12000,
    });

    if (!fetchRes.ok) {
      res.json({ results: [], searchUrl, error: `HTTP ${fetchRes.status}` });
      return;
    }

    const html = await fetchRes.text();
    const results = retailer.parse(html);
    res.json({ results, searchUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ results: [], searchUrl, error: msg });
  }
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => {
  console.log(`stash-shop-api listening on port ${PORT}`);
});

export default app;
