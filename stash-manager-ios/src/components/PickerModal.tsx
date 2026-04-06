/**
 * A custom iOS-style picker that shows options in a bottom-sheet modal.
 * Used in place of <select> for scale, category, status, etc.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS } from '../theme';

interface Props {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (val: string) => void;
}

export default function PickerModal({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.trigger}
        activeOpacity={0.75}
      >
        <Text style={styles.triggerLabel}>{label}</Text>
        <Text style={styles.triggerValue}>{value}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options as string[]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, item === value && styles.optionSelected]}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    item === value && styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {item === value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  triggerLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    minWidth: 60,
  },
  triggerValue: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 18,
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  optionSelected: {
    backgroundColor: '#1a2a3a',
  },
  optionText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#7eb8f7',
    fontWeight: '700',
  },
  checkmark: {
    color: '#7eb8f7',
    fontSize: 16,
  },
});
