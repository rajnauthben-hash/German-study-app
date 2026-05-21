import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, BorderRadius } from '../constants/theme';

interface Props {
  message: string;
  subMessage?: string;
}

export default function LoadingOverlay({ message, subMessage }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
        {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 240,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subMessage: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
