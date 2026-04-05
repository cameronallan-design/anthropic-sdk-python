import { useState, useRef } from "react";
import {
  Kit,
  ShopLink,
  ShopResult,
  CATEGORIES,
  SCALES,
  STATUSES,
  MANUFACTURERS,
  RETAILERS,
  EMPTY_KIT,
} from "../types";

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0f0f1a",
  border: "1px solid #2a2a3a",
  borderRadius: 6,
  padding: "8px 10px",
  color: "#d0d0e8",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
};

function btn(bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: bg,
    color,
    border: `1px solid ${color}33`,
    borderRadius: 5,
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    ...extra,
  };
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <label
        style={{
          display: "block",
          color: "#666",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Shop search panel ─────────────────────────────────────────────────────────

function ShopSearchPanel({
  kitName,
  onAdd,
}: {
  kitName: string;
  onAdd: (shop: ShopLink) => void;
}) {
  const [retailer, setRetailer] = useState<string>(RETAILERS[0].key);
  const [query, setQuery] = useState(kitName);
  const [results, setResults] = useState<ShopResult[]>([]);
  const [searchUrl, setSearchUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSearchUrl("");
    try {
      const res = await window.api.searchShop(retailer, query.trim());
      setResults(res.results);
      setSearchUrl(res.searchUrl ?? "");
      if (res.error) setError(`Note: ${res.error}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const retailerLabel =
    RETAILERS.find((r) => r.key === retailer)?.label ?? retailer;

  return (
    <div
      style={{
        background: "#0a0a14",
        border: "1px solid #2a2a3a",
        borderRadius: 8,
        padding: 14,
        marginTop: 10,
      }}
    >
      <div
        style={{
          color: "#888",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        Search UK Retailers
      </div>

      {/* Retailer tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {RETAILERS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRetailer(r.key)}
            style={{
              ...btn(
                retailer === r.key ? "#1a3a5f" : "#111",
                retailer === r.key ? "#7eb8f7" : "#555"
              ),
              padding: "4px 12px",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search term…"
          style={{ ...inputStyle, flex: 1, fontSize: 12 }}
        />
        <button
          onClick={search}
          disabled={loading}
          style={btn("#1a3a5f", "#7eb8f7")}
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {error && (
        <div style={{ color: "#f7c97e", fontSize: 11, marginTop: 6 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#111",
                borderRadius: 6,
                padding: "6px 10px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#d0d0e8",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.name}
                </div>
                {r.price && (
                  <div style={{ color: "#4ad972", fontSize: 11 }}>{r.price}</div>
                )}
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#555", fontSize: 11, textDecoration: "none" }}
              >
                ↗
              </a>
              <button
                onClick={() =>
                  onAdd({ name: r.retailer, url: r.url, price: r.price })
                }
                style={btn("#1a2a1a", "#7ef7b8", { padding: "3px 10px" })}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && searchUrl && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
          No results parsed.{" "}
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#7eb8f7" }}
          >
            Open {retailerLabel} search in browser ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  kit: Partial<Kit>;
  onSave: (kit: Kit) => void;
  onClose: () => void;
}

export default function KitForm({ kit, onSave, onClose }: Props) {
  const [form, setForm] = useState<Kit>({
    ...(EMPTY_KIT as Kit),
    ...kit,
    id: kit.id ?? "",
    addedAt: kit.addedAt ?? Date.now(),
    shops: kit.shops ?? [],
    boxArtUrl: kit.boxArtUrl ?? "",
  });

  const [shopInput, setShopInput] = useState<ShopLink>({
    name: "",
    url: "",
    price: "",
  });
  const [shopError, setShopError] = useState("");
  const [showShopSearch, setShowShopSearch] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Kit>(k: K, v: Kit[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Box art ──────────────────────────────────────────────────────────────

  async function pickImage() {
    setImgLoading(true);
    try {
      const dataUrl = await window.api.pickImage();
      if (dataUrl) set("boxArtUrl", dataUrl);
    } finally {
      setImgLoading(false);
    }
  }

  // ── Shop links ───────────────────────────────────────────────────────────

  function addShopManual() {
    if (!shopInput.name.trim() || !shopInput.url.trim()) {
      setShopError("Shop name and URL are required");
      return;
    }
    setForm((f) => ({
      ...f,
      shops: [...(f.shops ?? []), { ...shopInput }],
    }));
    setShopInput({ name: "", url: "", price: "" });
    setShopError("");
  }

  function removeShop(i: number) {
    setForm((f) => ({ ...f, shops: f.shops.filter((_, idx) => idx !== i) }));
  }

  function addShopFromSearch(shop: ShopLink) {
    setForm((f) => ({ ...f, shops: [...(f.shops ?? []), shop] }));
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#13131f",
          border: "1px solid #2a2a3a",
          borderRadius: 12,
          width: "100%",
          maxWidth: 580,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 24px 80px #000a",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#e8e8f0",
              fontSize: 18,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {form.id ? "Edit Kit" : "Add Kit to Stash"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {/* Kit name */}
          <Field label="Kit Name *">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Tiger I Early Production"
              style={inputStyle}
              autoFocus
            />
          </Field>

          {/* Manufacturer + Box number */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Manufacturer">
              <input
                list="manufacturers"
                value={form.manufacturer}
                onChange={(e) => set("manufacturer", e.target.value)}
                placeholder="e.g. Tamiya"
                style={inputStyle}
              />
              <datalist id="manufacturers">
                {MANUFACTURERS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Box / Kit No.">
              <input
                value={form.boxNumber}
                onChange={(e) => set("boxNumber", e.target.value)}
                placeholder="e.g. 35216"
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Scale / Category / Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Scale">
              <select
                value={form.scale}
                onChange={(e) => set("scale", e.target.value)}
                style={inputStyle}
              >
                {SCALES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                style={inputStyle}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Year */}
          <Field label="Year Released">
            <input
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="e.g. 1998"
              style={inputStyle}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Paint scheme, aftermarket refs, etc."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          {/* ── Box Art ────────────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid #1e1e2e", paddingTop: 16 }}>
            <div
              style={{
                color: "#888",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              Box Art
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* Preview */}
              <div
                style={{
                  width: 80,
                  height: 60,
                  borderRadius: 6,
                  border: "1px solid #2a2a3a",
                  background: "#0f0f1a",
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {form.boxArtUrl ? (
                  <img
                    src={form.boxArtUrl}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => set("boxArtUrl", "")}
                  />
                ) : (
                  "🖼"
                )}
              </div>

              <div style={{ flex: 1, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    ref={urlInputRef}
                    value={
                      form.boxArtUrl?.startsWith("data:") ? "" : form.boxArtUrl
                    }
                    onChange={(e) => set("boxArtUrl", e.target.value)}
                    placeholder="Paste image URL…"
                    style={{ ...inputStyle, fontSize: 12 }}
                  />
                  <button
                    onClick={pickImage}
                    disabled={imgLoading}
                    style={btn("#1a2a3a", "#7eb8f7")}
                  >
                    {imgLoading ? "…" : "📁 Pick"}
                  </button>
                </div>
                {form.boxArtUrl && (
                  <button
                    onClick={() => set("boxArtUrl", "")}
                    style={btn("#2a1515", "#f77e7e", { fontSize: 11 })}
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Shop Links ─────────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid #1e1e2e", paddingTop: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Shop Links
              </div>
              <button
                onClick={() => setShowShopSearch((x) => !x)}
                style={btn(
                  showShopSearch ? "#1a3a5f" : "#111",
                  showShopSearch ? "#7eb8f7" : "#666",
                  { fontSize: 11 }
                )}
              >
                🔍 Search Retailers
              </button>
            </div>

            {/* Existing shop links */}
            {(form.shops ?? []).map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  background: "#0f0f1a",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                <span
                  style={{ color: "#7eb8f7", fontSize: 12, flex: 1 }}
                >
                  🛒 {s.name}
                  {s.price ? ` — ${s.price}` : ""}
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#555", fontSize: 11 }}
                >
                  ↗
                </a>
                <button
                  onClick={() => removeShop(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#555",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Manual add row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px",
                gap: 8,
                marginTop: 6,
              }}
            >
              <input
                value={shopInput.name}
                onChange={(e) =>
                  setShopInput((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Shop name"
                style={{ ...inputStyle, fontSize: 12 }}
              />
              <input
                value={shopInput.url}
                onChange={(e) =>
                  setShopInput((s) => ({ ...s, url: e.target.value }))
                }
                placeholder="https://…"
                style={{ ...inputStyle, fontSize: 12 }}
              />
              <input
                value={shopInput.price}
                onChange={(e) =>
                  setShopInput((s) => ({ ...s, price: e.target.value }))
                }
                placeholder="£/€/$"
                style={{ ...inputStyle, fontSize: 12 }}
              />
            </div>
            {shopError && (
              <div style={{ color: "#f77e7e", fontSize: 12, marginTop: 4 }}>
                {shopError}
              </div>
            )}
            <button
              onClick={addShopManual}
              style={{
                ...btn("#1a2a1a", "#7ef7b8"),
                marginTop: 8,
                width: "100%",
              }}
            >
              + Add Shop Link Manually
            </button>

            {/* Retailer search panel */}
            {showShopSearch && (
              <ShopSearchPanel
                kitName={form.name}
                onAdd={addShopFromSearch}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{ ...btn("#1a1a1a", "#666"), flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            style={{
              flex: 2,
              background: form.name.trim() ? "#1a3a5f" : "#111",
              color: form.name.trim() ? "#7eb8f7" : "#444",
              border: "1px solid #4a90d933",
              borderRadius: 5,
              padding: "8px 16px",
              fontSize: 14,
              cursor: form.name.trim() ? "pointer" : "default",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            {form.id ? "Save Changes" : "Add to Stash"}
          </button>
        </div>
      </div>
    </div>
  );
}
