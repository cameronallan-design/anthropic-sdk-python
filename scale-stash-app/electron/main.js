const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const db = require("./db");

const isDev =
  process.env.NODE_ENV === "development" || !app.isPackaged;

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1160,
    height: 820,
    minWidth: 860,
    minHeight: 620,
    backgroundColor: "#0a0a12",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── Kit CRUD ──────────────────────────────────────────────────────────────────

ipcMain.handle("kits:getAll", () => db.getAllKits());
ipcMain.handle("kits:save", (_e, kit) => db.saveKit(kit));
ipcMain.handle("kits:delete", (_e, id) => db.deleteKit(id));
ipcMain.handle("kits:bulkImport", (_e, kits) => {
  db.bulkImport(kits);
  return db.getAllKits();
});

// ── Box art image pick ────────────────────────────────────────────────────────

ipcMain.handle("image:pick", async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: "Select Box Art Image",
    filters: [
      { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
    ],
    properties: ["openFile"],
  });
  if (canceled || !filePaths.length) return null;
  const data = fs.readFileSync(filePaths[0]);
  const ext = path.extname(filePaths[0]).slice(1).toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${data.toString("base64")}`;
});

// ── CSV export ────────────────────────────────────────────────────────────────

ipcMain.handle("csv:export", async (_e, kits) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: "stash.csv",
    filters: [{ name: "CSV Files", extensions: ["csv"] }],
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, generateCSV(kits), "utf8");
  return true;
});

function generateCSV(kits) {
  const headers = [
    "id",
    "name",
    "manufacturer",
    "scale",
    "category",
    "status",
    "boxNumber",
    "year",
    "notes",
    "boxArtUrl",
    "shops",
    "addedAt",
  ];
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n"))
      return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const kit of kits) {
    lines.push(
      headers
        .map((h) => {
          if (h === "shops") return escape(JSON.stringify(kit.shops || []));
          if (h === "boxArtUrl") {
            // Skip embedded base64 in CSV — write placeholder
            const url = kit.boxArtUrl || "";
            return escape(url.startsWith("data:") ? "[embedded image]" : url);
          }
          return escape(kit[h]);
        })
        .join(",")
    );
  }
  return lines.join("\r\n");
}

// ── CSV import (Scalemates + generic) ─────────────────────────────────────────

ipcMain.handle("csv:import", async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: "Import CSV (Scalemates export or Stash Manager CSV)",
    filters: [{ name: "CSV Files", extensions: ["csv"] }],
    properties: ["openFile"],
  });
  if (canceled || !filePaths.length) return null;
  const content = fs.readFileSync(filePaths[0], "utf8");
  return parseImportCSV(content);
});

function parseImportCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());

  // Column mapping for Scalemates and our own format
  const col = (names) => {
    for (const n of names) {
      const idx = headers.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxName = col(["name", "kit name", "title", "model"]);
  const idxBrand = col(["manufacturer", "brand", "maker"]);
  const idxScale = col(["scale"]);
  const idxNumber = col(["boxnumber", "box number", "kit number", "number", "ref"]);
  const idxCategory = col(["category", "type", "subject"]);
  const idxStatus = col(["status", "state"]);
  const idxYear = col(["year", "released"]);
  const idxNotes = col(["notes", "comment", "comments", "remarks"]);
  const idxShops = col(["shops"]);
  const idxId = col(["id"]);

  const STATUS_MAP = {
    "in stash": "Unbuilt",
    stash: "Unbuilt",
    unbuilt: "Unbuilt",
    wishlist: "Wishlist",
    "wish list": "Wishlist",
    "on the go": "WIP",
    wip: "WIP",
    "work in progress": "WIP",
    built: "Complete",
    complete: "Complete",
    completed: "Complete",
    finished: "Complete",
    "sold/donated": "Sold/Donated",
    sold: "Sold/Donated",
    donated: "Sold/Donated",
  };

  const VALID_SCALES = [
    "1/16","1/32","1/35","1/48","1/72","1/76","1/96","1/144","1/200","1/350","1/700",
  ];

  const kits = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.every((c) => !c.trim())) continue;

    const get = (idx) => (idx >= 0 ? (row[idx] || "").trim() : "");

    const rawStatus = get(idxStatus).toLowerCase();
    const status = STATUS_MAP[rawStatus] || "Unbuilt";

    const rawScale = get(idxScale);
    const scale = VALID_SCALES.includes(rawScale) ? rawScale : "1/35";

    let shops = [];
    const shopsRaw = get(idxShops);
    if (shopsRaw) {
      try { shops = JSON.parse(shopsRaw); } catch (_) {}
    }

    const existingId = get(idxId);
    kits.push({
      id: existingId || Date.now().toString(36) + Math.random().toString(36).slice(2) + i,
      name: get(idxName) || `Imported Kit ${i}`,
      manufacturer: get(idxBrand),
      scale,
      category: get(idxCategory) || "Other",
      status,
      boxNumber: get(idxNumber),
      year: get(idxYear),
      notes: get(idxNotes),
      boxArtUrl: "",
      shops,
      addedAt: Date.now() + i,
    });
  }
  return kits;
}

function parseCSVRow(line) {
  const cells = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cells.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

// ── Shop search ───────────────────────────────────────────────────────────────

const RETAILERS = {
  hannants: {
    name: "Hannants",
    searchUrl: (q) =>
      `https://www.hannants.co.uk/search/?query=${encodeURIComponent(q)}`,
    parse: parseHannants,
  },
  jadlam: {
    name: "Jadlam",
    searchUrl: (q) =>
      `https://www.jadlamracingmodels.com/search?q=${encodeURIComponent(q)}&options%5Bprefix%5D=last`,
    parse: parseJadlam,
  },
  rapidkit: {
    name: "Rapid Kit",
    searchUrl: (q) =>
      `https://www.rapidkit.co.uk/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    parse: parseRapidKit,
  },
};

ipcMain.handle("shop:search", async (_e, { retailer, query }) => {
  const r = RETAILERS[retailer];
  if (!r) return { error: "Unknown retailer", results: [] };

  const url = r.searchUrl(query);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      timeout: 10000,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const results = r.parse(html, url);
    return { results, searchUrl: url };
  } catch (err) {
    // Always return the search URL so the user can open the page manually
    return { error: err.message, results: [], searchUrl: url };
  }
});

function parseHannants(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];

  // Hannants product listing selectors (multiple fallbacks)
  const selectors = [
    ".listing-product",
    ".product-item",
    ".search-result",
    "article",
  ];

  let container = null;
  for (const sel of selectors) {
    if ($(sel).length > 0) { container = sel; break; }
  }

  if (!container) {
    // Last-resort: grab any link that looks like a product
    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      if (
        href.includes("/product") ||
        href.includes("/kit") ||
        href.match(/\/[A-Z]\d{4,}/)
      ) {
        results.push({
          name: text || href,
          url: href.startsWith("http") ? href : `https://www.hannants.co.uk${href}`,
          price: "",
          retailer: "Hannants",
        });
      }
      if (results.length >= 10) return false;
    });
    return results;
  }

  $(container).each((_i, el) => {
    const $el = $(el);
    const linkEl = $el.find("a[href]").first();
    const href = linkEl.attr("href") || "";
    const name =
      $el.find(".product-name, .title, h2, h3, h4").first().text().trim() ||
      linkEl.text().trim();
    const price =
      $el.find(".price, .product-price, [class*=price]").first().text().trim();

    if (name && href) {
      results.push({
        name,
        url: href.startsWith("http") ? href : `https://www.hannants.co.uk${href}`,
        price: price.replace(/\s+/g, " "),
        retailer: "Hannants",
      });
    }
    if (results.length >= 10) return false;
  });

  return results;
}

function parseJadlam(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];

  // Jadlam is Shopify — standard selectors
  const selectors = [
    ".product-item",
    ".grid__item",
    "[data-product-id]",
    ".product-card",
  ];

  let container = null;
  for (const sel of selectors) {
    if ($(sel).length > 0) { container = sel; break; }
  }

  const processItem = (_i, el) => {
    const $el = $(el);
    const linkEl = $el.find("a[href]").first();
    const href = linkEl.attr("href") || "";
    const name =
      $el
        .find(".product-item__title, .card__heading, h3, h4")
        .first()
        .text()
        .trim() || linkEl.text().trim();
    const price = $el
      .find(".price, .product-price, .money")
      .first()
      .text()
      .trim();

    if (name && href) {
      results.push({
        name,
        url: href.startsWith("http")
          ? href
          : `https://www.jadlamracingmodels.com${href}`,
        price: price.replace(/\s+/g, " "),
        retailer: "Jadlam",
      });
    }
    if (results.length >= 10) return false;
  };

  if (container) {
    $(container).each(processItem);
  } else {
    $("a[href*='/products/']").each((_i, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      const name = $el.text().trim();
      if (name && href) {
        results.push({
          name,
          url: href.startsWith("http")
            ? href
            : `https://www.jadlamracingmodels.com${href}`,
          price: "",
          retailer: "Jadlam",
        });
      }
      if (results.length >= 10) return false;
    });
  }

  return results;
}

function parseRapidKit(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];

  const selectors = [
    ".product-item",
    ".item.product",
    ".product",
    ".search-results .item",
  ];

  let container = null;
  for (const sel of selectors) {
    if ($(sel).length > 0) { container = sel; break; }
  }

  const processItem = (_i, el) => {
    const $el = $(el);
    const linkEl = $el.find("a[href]").first();
    const href = linkEl.attr("href") || "";
    const name =
      $el
        .find(".product-item-name, .product-name, h2, h3")
        .first()
        .text()
        .trim() || linkEl.text().trim();
    const price = $el
      .find(".price, .price-box, [class*=price]")
      .first()
      .text()
      .trim();

    if (name && href) {
      results.push({
        name,
        url: href.startsWith("http")
          ? href
          : `https://www.rapidkit.co.uk${href}`,
        price: price.replace(/\s+/g, " "),
        retailer: "Rapid Kit",
      });
    }
    if (results.length >= 10) return false;
  };

  if (container) {
    $(container).each(processItem);
  } else {
    $("a[href]").each((_i, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      if (href.includes(".html") || href.includes("/product")) {
        const name = $el.text().trim();
        if (name) {
          results.push({
            name,
            url: href.startsWith("http")
              ? href
              : `https://www.rapidkit.co.uk${href}`,
            price: "",
            retailer: "Rapid Kit",
          });
        }
      }
      if (results.length >= 10) return false;
    });
  }

  return results;
}
