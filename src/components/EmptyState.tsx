import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: Spacing.xxl },
  icon: { fontSize: 64, marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  description: { fontSize: Typography.fontSizeMD, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  btn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  btnText: { color: '#fff', fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});
