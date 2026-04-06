import { useState, useEffect, useMemo } from "react";
import {
  Kit,
  CATEGORIES,
  SCALES,
  STATUSES,
  STATUS_COLORS,
  EMPTY_KIT,
} from "../types";
import * as db from "../db";
import { kitsToCSV, csvToKits, downloadCSV } from "../utils/csv";
import KitCard from "./KitCard";
import KitForm from "./KitForm";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

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

export default function StashManager() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Partial<Kit> | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [filterScale, setFilterScale] = useState("All");
  const [sortBy, setSortBy] = useState("added");
  const [importMsg, setImportMsg] = useState("");

  // ── Load from IndexedDB on mount ─────────────────────────────────────────

  useEffect(() => {
    db.getAllKits()
      .then((data) => { setKits(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async function saveKit(form: Kit) {
    const kit: Kit = form.id
      ? form
      : { ...form, id: generateId(), addedAt: Date.now() };

    await db.saveKit(kit);
    setKits((ks) =>
      kit.id && ks.some((k) => k.id === kit.id)
        ? ks.map((k) => (k.id === kit.id ? kit : k))
        : [kit, ...ks]
    );
    setModal(null);
  }

  async function deleteKit(id: string) {
    if (!confirm("Remove this kit from your stash?")) return;
    await db.deleteKit(id);
    setKits((ks) => ks.filter((k) => k.id !== id));
  }

  async function changeStatus(id: string, status: string) {
    const kit = kits.find((k) => k.id === id);
    if (!kit) return;
    const updated = { ...kit, status };
    await db.saveKit(updated);
    setKits((ks) => ks.map((k) => (k.id === id ? updated : k)));
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function handleExport() {
    if (filtered.length === 0) {
      alert("No kits match the current filters.");
      return;
    }
    downloadCSV(kitsToCSV(filtered), "stash-export.csv");
    setImportMsg(`Exported ${filtered.length} kit(s) to CSV.`);
  }

  // ── CSV import ────────────────────────────────────────────────────────────

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const content = await file.text();
      const imported = csvToKits(content);
      if (imported.length === 0) {
        setImportMsg("No kits found in that CSV.");
        return;
      }
      if (!confirm(`Import ${imported.length} kit(s)? Existing kits with the same ID will be updated.`)) return;
      const updated = await db.bulkImport(imported);
      setKits(updated);
      setImportMsg(`Imported ${imported.length} kit(s).`);
    };
    input.click();
  }

  // ── Filtering / sorting ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...kits];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.manufacturer.toLowerCase().includes(q) ||
          k.boxNumber.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "All") list = list.filter((k) => k.status === filterStatus);
    if (filterCat !== "All") list = list.filter((k) => k.category === filterCat);
    if (filterScale !== "All") list = list.filter((k) => k.scale === filterScale);
    if (sortBy === "name")
      list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "manufacturer")
      list.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
    else
      list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return list;
  }, [kits, search, filterStatus, filterCat, filterScale, sortBy]);

  const stats = useMemo(
    () => ({
      total: kits.length,
      unbuilt: kits.filter((k) => k.status === "Unbuilt").length,
      wip: kits.filter((k) => k.status === "WIP").length,
      complete: kits.filter((k) => k.status === "Complete").length,
      wishlist: kits.filter((k) => k.status === "Wishlist").length,
    }),
    [kits]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a12",
        color: "#d0d0e8",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ── */}
      <div
        style={{
          background: "#0d0d1a",
          borderBottom: "1px solid #1a1a2e",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: 60,
          }}
        >
          <span style={{ fontSize: 24 }}>🪖</span>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontFamily: "'Playfair Display', serif",
                color: "#e8e8f0",
                letterSpacing: "0.02em",
              }}
            >
              Stash Manager
            </h1>
            <div
              style={{
                fontSize: 11,
                color: "#444",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Scale Plastic
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={handleImport}
              title="Import Scalemates or Stash CSV"
              style={headerBtn("#1a2a1a", "#7ef7b8")}
            >
              ⬆ Import CSV
            </button>
            <button
              onClick={handleExport}
              title="Export visible kits to CSV"
              style={headerBtn("#1a3a1a", "#4ad972")}
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={() => setModal({ ...EMPTY_KIT })}
              style={headerBtn("#1a3a5f", "#7eb8f7")}
            >
              + Add Kit
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px" }}>
        {/* ── Import message ── */}
        {importMsg && (
          <div
            style={{
              background: "#1a2a1a",
              border: "1px solid #4ad97244",
              color: "#7ef7b8",
              borderRadius: 6,
              padding: "8px 14px",
              fontSize: 13,
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {importMsg}
            <button
              onClick={() => setImportMsg("")}
              style={{
                background: "none",
                border: "none",
                color: "#4ad972",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Stats row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {(
            [
              { label: "Total",    value: stats.total,    color: "#e8e8f0" },
              { label: "Unbuilt",  value: stats.unbuilt,  color: STATUS_COLORS["Unbuilt"].dot },
              { label: "Wishlist", value: stats.wishlist, color: STATUS_COLORS["Wishlist"].dot },
              { label: "WIP",      value: stats.wip,      color: STATUS_COLORS["WIP"].dot },
              { label: "Complete", value: stats.complete, color: STATUS_COLORS["Complete"].dot },
            ] as const
          ).map((s) => (
            <div
              key={s.label}
              style={{
                background: "#13131f",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                padding: "12px 14px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Search kits…"
            style={{ ...inputStyle, flex: "1 1 180px", minWidth: 160 }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...inputStyle, flex: "0 0 auto" }}
          >
            <option>All</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            style={{ ...inputStyle, flex: "0 0 auto" }}
          >
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={filterScale}
            onChange={(e) => setFilterScale(e.target.value)}
            style={{ ...inputStyle, flex: "0 0 auto" }}
          >
            <option>All</option>
            {SCALES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ ...inputStyle, flex: "0 0 auto" }}
          >
            <option value="added">Recently Added</option>
            <option value="name">Name A–Z</option>
            <option value="manufacturer">Manufacturer</option>
          </select>
        </div>

        {/* ── Result count ── */}
        {kits.length > 0 && (
          <div style={{ color: "#444", fontSize: 12, marginBottom: 12 }}>
            Showing {filtered.length} of {kits.length} kit
            {kits.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* ── Kit list ── */}
        {!loaded ? (
          <div style={{ textAlign: "center", color: "#444", padding: 60 }}>
            Loading stash…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#333", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, color: "#555" }}>
              {kits.length === 0
                ? "Your stash is empty. Add your first kit!"
                : "No kits match your filters."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((kit) => (
              <KitCard
                key={kit.id}
                kit={kit}
                onEdit={(k) => setModal({ ...k })}
                onDelete={deleteKit}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <KitForm
          kit={modal}
          onSave={saveKit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function headerBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: `1px solid ${color}44`,
    borderRadius: 7,
    padding: "7px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };
}
