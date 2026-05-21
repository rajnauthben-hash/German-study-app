import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

interface Props {
  label: string;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
}

export default function QuizOption({ label, state, onPress, disabled }: Props) {
  const getColors = () => {
    switch (state) {
      case 'correct':
        return { bg: Colors.successLight, border: Colors.success, text: Colors.success };
      case 'incorrect':
        return { bg: Colors.errorLight, border: Colors.error, text: Colors.error };
      case 'selected':
        return { bg: Colors.primaryLight, border: Colors.primary, text: Colors.primary };
      default:
        return { bg: Colors.card, border: Colors.border, text: Colors.text };
    }
  };

  const { bg, border, text } = getColors();

  const getEmoji = () => {
    if (state === 'correct') return '✅ ';
    if (state === 'incorrect') return '❌ ';
    return '';
  };

  return (
    <TouchableOpacity
      style={[styles.option, { backgroundColor: bg, borderColor: border }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: text }]}>
        {getEmoji()}{label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
});
