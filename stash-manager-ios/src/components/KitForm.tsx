import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  generateId,
} from '../types';
import PickerModal from './PickerModal';
import { searchShop } from '../api';
import { COLORS } from '../theme';

interface Props {
  kit: Partial<Kit>;
  onSave: (kit: Kit) => void;
  onClose: () => void;
}

export default function KitForm({ kit, onSave, onClose }: Props) {
  const [form, setForm] = useState<Kit>({
    ...(EMPTY_KIT as Kit),
    ...kit,
    id: kit.id ?? '',
    addedAt: kit.addedAt ?? Date.now(),
    shops: kit.shops ?? [],
    boxArtUri: kit.boxArtUri ?? '',
  });

  const set = <K extends keyof Kit>(k: K, v: Kit[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Box art ────────────────────────────────────────────────────────────────

  const [imgLoading, setImgLoading] = useState(false);

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    setImgLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        set('boxArtUri', result.assets[0].uri);
      }
    } finally {
      setImgLoading(false);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access in Settings.');
      return;
    }
    setImgLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        set('boxArtUri', result.assets[0].uri);
      }
    } finally {
      setImgLoading(false);
    }
  }

  function showImageOptions() {
    Alert.alert('Box Art', 'Choose image source', [
      { text: 'Photo Library', onPress: pickFromLibrary },
      { text: 'Camera', onPress: pickFromCamera },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // ── Shop links ─────────────────────────────────────────────────────────────

  const [shopInput, setShopInput] = useState<ShopLink>({ name: '', url: '', price: '' });
  const [shopError, setShopError] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  function addShopManual() {
    if (!shopInput.name.trim() || !shopInput.url.trim()) {
      setShopError('Shop name and URL are required');
      return;
    }
    setForm((f) => ({ ...f, shops: [...(f.shops ?? []), { ...shopInput }] }));
    setShopInput({ name: '', url: '', price: '' });
    setShopError('');
  }

  function removeShop(i: number) {
    setForm((f) => ({ ...f, shops: f.shops.filter((_, idx) => idx !== i) }));
  }

  function addShopFromSearch(shop: ShopLink) {
    setForm((f) => ({ ...f, shops: [...(f.shops ?? []), shop] }));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!form.name.trim()) return;
    const kit: Kit = form.id
      ? form
      : { ...form, id: generateId(), addedAt: Date.now() };
    onSave(kit);
  }

  const isValid = form.name.trim().length > 0;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Title bar */}
        <View style={styles.titleBar}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {form.id ? 'Edit Kit' : 'Add Kit'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid}
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
          >
            <Text style={[styles.saveText, !isValid && styles.saveTextDisabled]}>
              {form.id ? 'Save' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Kit Name */}
          <FieldLabel>Kit Name *</FieldLabel>
          <TextInput
            value={form.name}
            onChangeText={(t) => set('name', t)}
            placeholder="e.g. Tiger I Early Production"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoFocus
          />

          {/* Manufacturer */}
          <FieldLabel>Manufacturer</FieldLabel>
          <TextInput
            value={form.manufacturer}
            onChangeText={(t) => set('manufacturer', t)}
            placeholder="e.g. Tamiya"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionRow}
            contentContainerStyle={styles.suggestionContent}
          >
            {MANUFACTURERS.filter((m) =>
              form.manufacturer
                ? m.toLowerCase().startsWith(form.manufacturer.toLowerCase())
                : true
            )
              .slice(0, 8)
              .map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => set('manufacturer', m)}
                  style={[
                    styles.suggestion,
                    form.manufacturer === m && styles.suggestionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      form.manufacturer === m && styles.suggestionTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          {/* Box Number */}
          <FieldLabel>Box / Kit No.</FieldLabel>
          <TextInput
            value={form.boxNumber}
            onChangeText={(t) => set('boxNumber', t)}
            placeholder="e.g. 35216"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          {/* Scale / Category / Status — pickers */}
          <View style={styles.row3}>
            <View style={styles.col}>
              <FieldLabel>Scale</FieldLabel>
              <PickerModal
                label="Scale"
                value={form.scale}
                options={SCALES}
                onChange={(v) => set('scale', v)}
              />
            </View>
            <View style={styles.col}>
              <FieldLabel>Category</FieldLabel>
              <PickerModal
                label="Cat."
                value={form.category}
                options={CATEGORIES}
                onChange={(v) => set('category', v)}
              />
            </View>
          </View>

          <FieldLabel>Status</FieldLabel>
          <PickerModal
            label="Status"
            value={form.status}
            options={STATUSES}
            onChange={(v) => set('status', v)}
          />

          {/* Year */}
          <FieldLabel>Year Released</FieldLabel>
          <TextInput
            value={form.year}
            onChangeText={(t) => set('year', t)}
            placeholder="e.g. 1998"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            keyboardType="number-pad"
          />

          {/* Notes */}
          <FieldLabel>Notes</FieldLabel>
          <TextInput
            value={form.notes}
            onChangeText={(t) => set('notes', t)}
            placeholder="Paint scheme, aftermarket refs, etc."
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={3}
          />

          {/* ── Box Art ─────────────────────────────────────────────────── */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>BOX ART</Text>

          <View style={styles.artRow}>
            <View style={styles.artPreview}>
              {form.boxArtUri ? (
                <Image
                  source={{ uri: form.boxArtUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                  onError={() => set('boxArtUri', '')}
                />
              ) : (
                <Text style={styles.artPlaceholder}>🖼</Text>
              )}
            </View>

            <View style={styles.artControls}>
              <TextInput
                value={form.boxArtUri?.startsWith('http') ? form.boxArtUri : ''}
                onChangeText={(t) => set('boxArtUri', t)}
                placeholder="Paste image URL…"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, styles.inputSmall]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <View style={styles.artBtns}>
                <TouchableOpacity
                  onPress={showImageOptions}
                  disabled={imgLoading}
                  style={styles.artPickBtn}
                  activeOpacity={0.75}
                >
                  {imgLoading ? (
                    <ActivityIndicator size="small" color={COLORS.accent} />
                  ) : (
                    <Text style={styles.artPickBtnText}>📁 Pick Photo</Text>
                  )}
                </TouchableOpacity>
                {form.boxArtUri ? (
                  <TouchableOpacity
                    onPress={() => set('boxArtUri', '')}
                    style={styles.artRemoveBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.artRemoveBtnText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Shop Links ──────────────────────────────────────────────── */}
          <View style={styles.sectionDivider} />
          <View style={styles.shopHeader}>
            <Text style={styles.sectionTitle}>SHOP LINKS</Text>
            <TouchableOpacity
              onPress={() => setShowSearch((x) => !x)}
              style={[styles.searchToggle, showSearch && styles.searchToggleActive]}
            >
              <Text
                style={[
                  styles.searchToggleText,
                  showSearch && styles.searchToggleTextActive,
                ]}
              >
                🔍 Search Retailers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Existing links */}
          {(form.shops ?? []).map((s, i) => (
            <View key={i} style={styles.shopItem}>
              <View style={styles.shopItemInner}>
                <Text style={styles.shopItemText} numberOfLines={1}>
                  🛒 {s.name}
                  {s.price ? ` — ${s.price}` : ''}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(s.url).catch(() => {})}
                  style={styles.shopLinkBtn}
                >
                  <Text style={styles.shopLinkText}>↗</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeShop(i)} style={styles.shopRemoveBtn}>
                  <Text style={styles.shopRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Manual add */}
          <View style={styles.manualAddRow}>
            <TextInput
              value={shopInput.name}
              onChangeText={(t) => setShopInput((s) => ({ ...s, name: t }))}
              placeholder="Shop name"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.input, styles.shopInputName]}
            />
            <TextInput
              value={shopInput.url}
              onChangeText={(t) => setShopInput((s) => ({ ...s, url: t }))}
              placeholder="https://…"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.input, styles.shopInputUrl]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              value={shopInput.price}
              onChangeText={(t) => setShopInput((s) => ({ ...s, price: t }))}
              placeholder="£ price"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.input, styles.shopInputPrice]}
            />
          </View>
          {shopError ? <Text style={styles.shopError}>{shopError}</Text> : null}
          <TouchableOpacity
            onPress={addShopManual}
            style={styles.addShopBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.addShopBtnText}>+ Add Shop Link Manually</Text>
          </TouchableOpacity>

          {/* Retailer search panel */}
          {showSearch && (
            <ShopSearchPanel kitName={form.name} onAdd={addShopFromSearch} />
          )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Field label helper ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

// ── Shop search panel ──────────────────────────────────────────────────────────

function ShopSearchPanel({
  kitName,
  onAdd,
}: {
  kitName: string;
  onAdd: (shop: ShopLink) => void;
}) {
  const [retailer, setRetailer] = useState(RETAILERS[0].key);
  const [query, setQuery] = useState(kitName);
  const [results, setResults] = useState<ShopResult[]>([]);
  const [searchUrl, setSearchUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSearchUrl('');
    try {
      const res = await searchShop(retailer, query.trim());
      setResults(res.results);
      setSearchUrl(res.searchUrl ?? '');
      if (res.error) setError(`Note: ${res.error}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.searchPanel}>
      <Text style={styles.searchPanelTitle}>SEARCH UK RETAILERS</Text>

      {/* Retailer tabs */}
      <View style={styles.retailerTabs}>
        {RETAILERS.map((r) => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setRetailer(r.key)}
            style={[
              styles.retailerTab,
              retailer === r.key && styles.retailerTabActive,
            ]}
          >
            <Text
              style={[
                styles.retailerTabText,
                retailer === r.key && styles.retailerTabTextActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search input */}
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          placeholder="Search term…"
          placeholderTextColor={COLORS.textMuted}
          style={[styles.input, { flex: 1 }]}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={doSearch}
          disabled={loading}
          style={styles.searchBtn}
          activeOpacity={0.75}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <Text style={styles.searchBtnText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.searchError}>{error}</Text> : null}

      {results.map((r, i) => (
        <View key={i} style={styles.searchResult}>
          <View style={styles.searchResultInfo}>
            <Text style={styles.searchResultName} numberOfLines={2}>{r.name}</Text>
            {r.price ? <Text style={styles.searchResultPrice}>{r.price}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL(r.url).catch(() => {})}
            style={styles.searchResultLink}
          >
            <Text style={styles.searchResultLinkText}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAdd({ name: r.retailer, url: r.url, price: r.price })}
            style={styles.searchAddBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.searchAddBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      ))}

      {results.length === 0 && !loading && searchUrl && (
        <TouchableOpacity
          onPress={() => Linking.openURL(searchUrl).catch(() => {})}
          style={styles.openBrowserBtn}
        >
          <Text style={styles.openBrowserText}>No results — open in browser ↗</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgHeader,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  cancelBtn: { padding: 4 },
  cancelText: { color: COLORS.accent, fontSize: 16 },
  saveBtn: {
    backgroundColor: '#1a3a5f',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnDisabled: { backgroundColor: '#111' },
  saveText: { color: COLORS.accent, fontWeight: '700', fontSize: 15 },
  saveTextDisabled: { color: '#444' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 4 },

  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  inputSmall: {
    fontSize: 12,
    paddingVertical: 8,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Manufacturer suggestions
  suggestionRow: { marginTop: 6 },
  suggestionContent: { gap: 6, paddingRight: 4 },
  suggestion: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionActive: {
    backgroundColor: '#1a3a5f',
    borderColor: COLORS.accentDim + '44',
  },
  suggestionText: { color: COLORS.textSecondary, fontSize: 12 },
  suggestionTextActive: { color: COLORS.accent },

  // Scale / Category row
  row3: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  // Section divider
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Box art
  artRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  artPreview: {
    width: 80,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  artPlaceholder: { fontSize: 24 },
  artControls: { flex: 1, gap: 6 },
  artBtns: { flexDirection: 'row', gap: 8 },
  artPickBtn: {
    backgroundColor: '#1a2a3a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.accent + '33',
    minWidth: 90,
    alignItems: 'center',
  },
  artPickBtnText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
  artRemoveBtn: {
    backgroundColor: COLORS.redBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.red + '33',
  },
  artRemoveBtnText: { color: COLORS.red, fontSize: 12 },

  // Shop links
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  searchToggle: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchToggleActive: {
    backgroundColor: '#1a3a5f',
    borderColor: COLORS.accentDim + '44',
  },
  searchToggleText: { color: '#666', fontSize: 11 },
  searchToggleTextActive: { color: COLORS.accent },

  shopItem: {
    marginBottom: 6,
  },
  shopItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  shopItemText: { flex: 1, color: COLORS.accent, fontSize: 12 },
  shopLinkBtn: { padding: 4 },
  shopLinkText: { color: COLORS.textMuted, fontSize: 14 },
  shopRemoveBtn: { padding: 4 },
  shopRemoveText: { color: COLORS.textMuted, fontSize: 16 },

  manualAddRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  shopInputName: { flex: 1.2 },
  shopInputUrl: { flex: 2 },
  shopInputPrice: { flex: 0.8 },
  shopError: { color: COLORS.red, fontSize: 12, marginTop: 4 },
  addShopBtn: {
    backgroundColor: '#1a2a1a',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.greenText + '33',
  },
  addShopBtnText: { color: COLORS.greenText, fontSize: 12, fontWeight: '600' },

  // Shop search panel
  searchPanel: {
    backgroundColor: '#0a0a14',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  searchPanelTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  retailerTabs: { flexDirection: 'row', gap: 6 },
  retailerTab: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  retailerTabActive: {
    backgroundColor: '#1a3a5f',
    borderColor: COLORS.accentDim + '44',
  },
  retailerTabText: { color: '#555', fontSize: 12 },
  retailerTabTextActive: { color: COLORS.accent },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchBtn: {
    backgroundColor: '#1a3a5f',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  searchBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  searchError: { color: '#f7c97e', fontSize: 11 },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 6,
    padding: 8,
    gap: 8,
  },
  searchResultInfo: { flex: 1, minWidth: 0 },
  searchResultName: { color: COLORS.textPrimary, fontSize: 12 },
  searchResultPrice: { color: COLORS.green, fontSize: 11, marginTop: 2 },
  searchResultLink: { padding: 4 },
  searchResultLinkText: { color: COLORS.textMuted, fontSize: 14 },
  searchAddBtn: {
    backgroundColor: '#1a2a1a',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.greenText + '33',
  },
  searchAddBtnText: { color: COLORS.greenText, fontSize: 12 },
  openBrowserBtn: { marginTop: 6 },
  openBrowserText: { color: COLORS.accent, fontSize: 12, textDecorationLine: 'underline' },
});
