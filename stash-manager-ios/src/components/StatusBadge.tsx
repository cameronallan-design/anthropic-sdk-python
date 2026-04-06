import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../types';

interface Props {
  status: string;
  small?: boolean;
}

export default function StatusBadge({ status, small = false }: Props) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['Unbuilt'];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.dot + '44' }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.text, fontSize: small ? 9 : 10 }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
