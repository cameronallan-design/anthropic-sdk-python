import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kit, STATUS_COLORS, CATEGORIES, STATUSES } from '../types';
import * as db from '../db';
import { COLORS } from '../theme';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getAllKits()
      .then((data) => { setKits(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byScale: Record<string, number> = {};
    const byManufacturer: Record<string, number> = {};

    for (const k of kits) {
      byStatus[k.status]           = (byStatus[k.status]           ?? 0) + 1;
      byCategory[k.category]       = (byCategory[k.category]       ?? 0) + 1;
      byScale[k.scale]             = (byScale[k.scale]             ?? 0) + 1;
      byManufacturer[k.manufacturer] = (byManufacturer[k.manufacturer] ?? 0) + 1;
    }

    const topManufacturers = Object.entries(byManufacturer)
      .filter(([m]) => m.trim())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topScales = Object.entries(byScale)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { byStatus, byCategory, topManufacturers, topScales };
  }, [kits]);

  if (!loaded) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Dashboard</Text>
        <Text style={styles.headerSub}>STASH STATISTICS</Text>
      </View>

      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalNumber}>{kits.length}</Text>
        <Text style={styles.totalLabel}>Total Kits</Text>
      </View>

      {/* Status breakdown */}
      <SectionTitle>By Status</SectionTitle>
      <View style={styles.statusGrid}>
        {STATUSES.map((s) => {
          const count = stats.byStatus[s] ?? 0;
          const c = STATUS_COLORS[s];
          const pct = kits.length > 0 ? count / kits.length : 0;
          return (
            <View key={s} style={[styles.statusCard, { backgroundColor: c.bg, borderColor: c.dot + '44' }]}>
              <View style={styles.statusDotRow}>
                <View style={[styles.dot, { backgroundColor: c.dot }]} />
                <Text style={[styles.statusName, { color: c.text }]}>{s.toUpperCase()}</Text>
              </View>
              <Text style={[styles.statusCount, { color: c.text }]}>{count}</Text>
              {/* Progress bar */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { backgroundColor: c.dot, width: `${Math.round(pct * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: c.dot }]}>
                {kits.length > 0 ? `${Math.round(pct * 100)}%` : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Category breakdown */}
      <SectionTitle>By Category</SectionTitle>
      {CATEGORIES.map((cat) => {
        const count = stats.byCategory[cat] ?? 0;
        if (count === 0) return null;
        const pct = kits.length > 0 ? count / kits.length : 0;
        return (
          <BarRow
            key={cat}
            label={cat}
            count={count}
            pct={pct}
            color={COLORS.accent}
          />
        );
      })}

      {/* Top manufacturers */}
      {stats.topManufacturers.length > 0 && (
        <>
          <SectionTitle>Top Manufacturers</SectionTitle>
          {stats.topManufacturers.map(([name, count]) => (
            <BarRow
              key={name}
              label={name || 'Unknown'}
              count={count}
              pct={kits.length > 0 ? count / kits.length : 0}
              color="#d9924a"
            />
          ))}
        </>
      )}

      {/* Top scales */}
      {stats.topScales.length > 0 && (
        <>
          <SectionTitle>Popular Scales</SectionTitle>
          {stats.topScales.map(([scale, count]) => (
            <BarRow
              key={scale}
              label={scale}
              count={count}
              pct={kits.length > 0 ? count / kits.length : 0}
              color="#924ad9"
            />
          ))}
        </>
      )}

      {kits.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            Add kits to your stash to see statistics here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function BarRow({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barRowLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barRowTrack}>
        <View
          style={[
            styles.barRowFill,
            { backgroundColor: color, width: `${Math.max(2, Math.round(pct * 100))}%` },
          ]}
        />
      </View>
      <Text style={[styles.barRowCount, { color }]}>{count}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 8 },

  header: {
    backgroundColor: COLORS.bgHeader,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#333', fontSize: 10, letterSpacing: 1.2, marginTop: 2 },

  totalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  totalNumber: {
    color: COLORS.textPrimary,
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
  },
  totalLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },

  // Status cards
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statusDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusName: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  statusCount: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  barTrack: {
    height: 3,
    backgroundColor: '#00000033',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 3, borderRadius: 2 },
  barLabel: { fontSize: 10, fontWeight: '600' },

  // Bar rows
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 4,
  },
  barRowLabel: { color: COLORS.textPrimary, fontSize: 13, minWidth: 90 },
  barRowTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barRowFill: { height: 4, borderRadius: 2 },
  barRowCount: { fontSize: 13, fontWeight: '700', minWidth: 24, textAlign: 'right' },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
