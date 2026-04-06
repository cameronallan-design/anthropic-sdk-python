import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kit, CATEGORIES, SCALES, STATUSES, EMPTY_KIT } from '../types';
import * as db from '../db';
import { kitsToCSV, csvToKits } from '../utils/csv';
import KitCard from '../components/KitCard';
import KitForm from '../components/KitForm';
import PickerModal from '../components/PickerModal';
import { COLORS } from '../theme';

const SORT_OPTIONS = ['Recently Added', 'Name A–Z', 'Manufacturer'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function StashScreen() {
  const insets = useSafeAreaInsets();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Partial<Kit> | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  const [filterScale, setFilterScale] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('Recently Added');

  const [statusMsg, setStatusMsg] = useState('');

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    db.getAllKits()
      .then((data) => { setKits(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const saveKit = useCallback(async (kit: Kit) => {
    await db.saveKit(kit);
    setKits((ks) =>
      ks.some((k) => k.id === kit.id)
        ? ks.map((k) => (k.id === kit.id ? kit : k))
        : [kit, ...ks]
    );
    setModal(null);
  }, []);

  const deleteKit = useCallback(async (id: string) => {
    await db.deleteKit(id);
    setKits((ks) => ks.filter((k) => k.id !== id));
  }, []);

  const changeStatus = useCallback(async (id: string, status: string) => {
    const kit = kits.find((k) => k.id === id);
    if (!kit) return;
    const updated = { ...kit, status };
    await db.saveKit(updated);
    setKits((ks) => ks.map((k) => (k.id === id ? updated : k)));
  }, [kits]);

  // ── CSV export ──────────────────────────────────────────────────────────────
  async function handleExport() {
    if (filtered.length === 0) {
      Alert.alert('Nothing to export', 'No kits match the current filters.');
      return;
    }
    try {
      const csv = kitsToCSV(filtered);
      const path = FileSystem.cacheDirectory + 'stash-export.csv';
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      } else {
        await Share.share({ url: path, title: 'stash-export.csv' });
      }
      flash(`Exported ${filtered.length} kit(s).`);
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  }

  // ── CSV import ──────────────────────────────────────────────────────────────
  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const imported = csvToKits(content);
      if (imported.length === 0) {
        Alert.alert('No kits found', 'That CSV had no recognisable kit rows.');
        return;
      }
      Alert.alert(
        `Import ${imported.length} kit(s)?`,
        'This will add them to your stash. Existing kits with the same ID will be updated.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              const updated = await db.bulkImport(imported);
              setKits(updated);
              flash(`Imported ${imported.length} kit(s).`);
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Import failed', String(e));
    }
  }

  function flash(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  }

  // ── Filter / sort ───────────────────────────────────────────────────────────
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
    if (filterStatus !== 'All') list = list.filter((k) => k.status === filterStatus);
    if (filterCat    !== 'All') list = list.filter((k) => k.category === filterCat);
    if (filterScale  !== 'All') list = list.filter((k) => k.scale === filterScale);
    if (sortBy === 'Name A–Z')
      list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'Manufacturer')
      list.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
    else
      list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return list;
  }, [kits, search, filterStatus, filterCat, filterScale, sortBy]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🪖</Text>
          <View>
            <Text style={styles.headerTitle}>Stash Manager</Text>
            <Text style={styles.headerSub}>SCALE PLASTIC</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleImport} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>⬆ Import</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={[styles.headerBtn, styles.headerBtnGreen]}>
            <Text style={[styles.headerBtnText, styles.headerBtnTextGreen]}>⬇ Export</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModal({ ...EMPTY_KIT })}
            style={[styles.headerBtn, styles.headerBtnBlue]}
          >
            <Text style={[styles.headerBtnText, styles.headerBtnTextBlue]}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status message */}
      {statusMsg ? (
        <View style={styles.flashBar}>
          <Text style={styles.flashText}>{statusMsg}</Text>
          <TouchableOpacity onPress={() => setStatusMsg('')}>
            <Text style={styles.flashClose}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="🔍  Search kits…"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter row */}
      <View style={styles.filterRow}>
        <PickerModal
          label="Status"
          value={filterStatus}
          options={['All', ...STATUSES]}
          onChange={setFilterStatus}
        />
        <PickerModal
          label="Cat."
          value={filterCat}
          options={['All', ...CATEGORIES]}
          onChange={setFilterCat}
        />
        <PickerModal
          label="Scale"
          value={filterScale}
          options={['All', ...SCALES]}
          onChange={setFilterScale}
        />
        <PickerModal
          label="Sort"
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={(v) => setSortBy(v as SortOption)}
        />
      </View>

      {/* Result count */}
      {kits.length > 0 && (
        <Text style={styles.countLabel}>
          {filtered.length} of {kits.length} kit{kits.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Kit list */}
      {!loaded ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.emptyText}>Loading stash…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(k) => k.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          renderItem={({ item }) => (
            <KitCard
              kit={item}
              onEdit={(k) => setModal({ ...k })}
              onDelete={deleteKit}
              onStatusChange={changeStatus}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>
                {kits.length === 0
                  ? 'Your stash is empty.\nTap + Add to add your first kit!'
                  : 'No kits match your filters.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add / Edit modal */}
      {modal && (
        <KitForm kit={modal} onSave={saveKit} onClose={() => setModal(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 22 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#333', fontSize: 10, letterSpacing: 1 },
  headerRight: { flexDirection: 'row', gap: 6 },
  headerBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  headerBtnGreen: { backgroundColor: '#1a2a1a', borderColor: COLORS.green + '44' },
  headerBtnBlue:  { backgroundColor: '#1a2a3a', borderColor: COLORS.accentDim + '44' },
  headerBtnText:      { color: '#888', fontSize: 11, fontWeight: '700' },
  headerBtnTextGreen: { color: COLORS.greenText },
  headerBtnTextBlue:  { color: COLORS.accent },

  // Flash
  flashBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a1a',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.green + '44',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  flashText: { flex: 1, color: COLORS.greenText, fontSize: 13 },
  flashClose: { color: COLORS.green, fontSize: 18, paddingLeft: 10 },

  // Search
  searchBar: { paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  // Count
  countLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },

  // List
  listContent: { paddingHorizontal: 12, paddingTop: 4 },

  // Empty
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#555', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
