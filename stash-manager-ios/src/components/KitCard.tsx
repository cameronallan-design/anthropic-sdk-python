import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Kit, STATUS_COLORS, STATUSES, CATEGORY_ICONS } from '../types';
import StatusBadge from './StatusBadge';
import { COLORS } from '../theme';

interface Props {
  kit: Kit;
  onEdit: (kit: Kit) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function KitCard({ kit, onEdit, onDelete, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError]  = useState(false);

  const hasArt = !!kit.boxArtUri && !imgError;

  function confirmDelete() {
    Alert.alert(
      'Remove Kit',
      `Remove "${kit.name}" from your stash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDelete(kit.id),
        },
      ]
    );
  }

  // Next two statuses in the workflow for quick-change buttons
  const nextStatuses = STATUSES.filter((s) => s !== kit.status).slice(0, 2);

  return (
    <View style={styles.card}>
      {/* ── Header row ── */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((x) => !x)}
        activeOpacity={0.8}
      >
        {/* Thumbnail */}
        <View style={styles.thumb}>
          {hasArt ? (
            <Image
              source={{ uri: kit.boxArtUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Text style={styles.thumbIcon}>
              {CATEGORY_ICONS[kit.category] ?? '📦'}
            </Text>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>
            {kit.name || 'Unnamed Kit'}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {[kit.manufacturer, kit.scale, kit.boxNumber].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View style={styles.right}>
          <StatusBadge status={kit.status} small />
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Expanded detail ── */}
      {expanded && (
        <View style={styles.detail}>
          {/* Large box art + metadata grid */}
          <View style={styles.detailTop}>
            {hasArt && (
              <Image
                source={{ uri: kit.boxArtUri }}
                style={styles.artLarge}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            )}
            <View style={styles.infoGrid}>
              {kit.category ? <InfoRow label="Category" value={kit.category} /> : null}
              {kit.year ? <InfoRow label="Year" value={kit.year} /> : null}
              {kit.notes ? (
                <View style={styles.notesRow}>
                  <InfoRow label="Notes" value={kit.notes} />
                </View>
              ) : null}
            </View>
          </View>

          {/* Shop links */}
          {kit.shops && kit.shops.length > 0 && (
            <View style={styles.shopsSection}>
              <Text style={styles.sectionLabel}>SHOP LINKS</Text>
              <View style={styles.shopChips}>
                {kit.shops.map((s, i) => (
                  <Pressable
                    key={i}
                    onPress={() => Linking.openURL(s.url).catch(() => {})}
                    style={({ pressed }) => [
                      styles.shopChip,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.shopChipText}>
                      🛒 {s.name}
                      {s.price ? ` — ${s.price}` : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnEdit]}
              onPress={() => onEdit(kit)}
              activeOpacity={0.75}
            >
              <Text style={styles.btnEditText}>✏️ Edit</Text>
            </TouchableOpacity>

            {nextStatuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.btn, styles.btnStatus]}
                onPress={() => onStatusChange(kit.id, s)}
                activeOpacity={0.75}
              >
                <Text style={styles.btnStatusText}>→ {s}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.spacer} />

            <TouchableOpacity
              style={[styles.btn, styles.btnDelete]}
              onPress={confirmDelete}
              activeOpacity={0.75}
            >
              <Text style={styles.btnDeleteText}>🗑 Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label.toUpperCase()} </Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbIcon: {
    fontSize: 22,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  sub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  chevron: {
    color: '#444',
    fontSize: 12,
  },

  // Expanded
  detail: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 14,
    backgroundColor: COLORS.inputBg,
    gap: 14,
  },
  detailTop: {
    flexDirection: 'row',
    gap: 12,
  },
  artLarge: {
    width: 100,
    height: 75,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    flexShrink: 0,
  },
  infoGrid: {
    flex: 1,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  infoValue: {
    color: '#bbb',
    fontSize: 12,
  },
  notesRow: {
    width: '100%',
  },

  // Shop links
  shopsSection: {
    gap: 6,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  shopChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  shopChip: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#334',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shopChipText: {
    color: COLORS.accent,
    fontSize: 12,
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  spacer: { flex: 1 },
  btn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  btnEdit: {
    backgroundColor: '#1a2a3a',
    borderColor: COLORS.accent + '33',
  },
  btnEditText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  btnStatus: {
    backgroundColor: COLORS.inputBg,
    borderColor: '#33334455',
  },
  btnStatusText: {
    color: '#aaa',
    fontSize: 12,
  },
  btnDelete: {
    backgroundColor: COLORS.redBg,
    borderColor: COLORS.red + '33',
  },
  btnDeleteText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '600',
  },
});
