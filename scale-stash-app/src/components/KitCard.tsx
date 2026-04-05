import { useState } from "react";
import { Kit, STATUS_COLORS, STATUSES } from "../types";

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Unbuilt"];
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.dot}33`,
        borderRadius: 4,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

function categoryIcon(cat: string) {
  const icons: Record<string, string> = {
    Armour: "🪖",
    Aircraft: "✈️",
    Ships: "🚢",
    Figures: "🧍",
    Vehicles: "🚗",
    Other: "📦",
  };
  return icons[cat] ?? "📦";
}

function btn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: `1px solid ${color}22`,
    borderRadius: 5,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

interface Props {
  kit: Kit;
  onEdit: (kit: Kit) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function KitCard({ kit, onEdit, onDelete, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasArt = kit.boxArtUrl && !imgError;

  return (
    <div
      style={{
        background: "#13131f",
        border: "1px solid #222",
        borderRadius: 8,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#334")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
    >
      {/* ── Header row ── */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((x) => !x)}
      >
        {/* Thumbnail / icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            background: "#1a1a2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
            border: "1px solid #222",
            overflow: "hidden",
          }}
        >
          {hasArt ? (
            <img
              src={kit.boxArtUrl}
              alt="box art"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            categoryIcon(kit.category)
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#e8e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {kit.name || "Unnamed Kit"}
          </div>
          <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
            {[kit.manufacturer, kit.scale, kit.boxNumber]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <StatusBadge status={kit.status} />
          <span style={{ color: "#444", fontSize: 18, userSelect: "none" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid #1e1e2e",
            padding: "14px 16px",
            background: "#0f0f1a",
          }}
        >
          {/* Box art (large) + metadata */}
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            {hasArt && (
              <img
                src={kit.boxArtUrl}
                alt="box art"
                style={{
                  width: 120,
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #2a2a3a",
                  flexShrink: 0,
                }}
                onError={() => setImgError(true)}
              />
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 24px",
                flex: 1,
              }}
            >
              {kit.category && <Info label="Category" value={kit.category} />}
              {kit.year && <Info label="Year" value={kit.year} />}
              {kit.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Info label="Notes" value={kit.notes} />
                </div>
              )}
            </div>
          </div>

          {/* Shop links */}
          {kit.shops && kit.shops.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  color: "#555",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                Shop Links
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {kit.shops.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#1a1a2e",
                      border: "1px solid #334",
                      color: "#7eb8f7",
                      borderRadius: 4,
                      padding: "3px 10px",
                      fontSize: 12,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    🛒 {s.name}
                    {s.price ? ` — ${s.price}` : ""}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => onEdit(kit)} style={btn("#1a2a3a", "#7eb8f7")}>
              ✏️ Edit
            </button>
            {STATUSES.filter((s) => s !== kit.status)
              .slice(0, 2)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(kit.id, s)}
                  style={btn("#1a1a2e", "#aaa")}
                >
                  → {s}
                </button>
              ))}
            <button
              onClick={() => onDelete(kit.id)}
              style={{ ...btn("#2a1515", "#f77e7e"), marginLeft: "auto" }}
            >
              🗑 Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          color: "#555",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}{" "}
      </span>
      <span style={{ color: "#bbb", fontSize: 13 }}>{value}</span>
    </div>
  );
}
