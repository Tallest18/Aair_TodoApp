import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
}

/**
 * A frosted-glass surface (BlurView + a translucent tint + a hairline
 * border), lifted off the background with a soft colored shadow so it reads
 * as a distinct floating card rather than blending into the gradient behind
 * it. Reserved for "chrome" elements — the hero/stats card, headers — rather
 * than every scrollable list row, both because heavy blur on many recycled
 * rows is comparatively expensive and because a flat, readable surface reads
 * better once a swipe-action background needs to show through.
 */
export default function GlassCard({ children, style, intensity = 50, radius = 24 }: GlassCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.shadowWrapper, { borderRadius: radius, shadowColor: colors.cardShadow }, style]}>
      <View style={[styles.wrapper, { borderColor: colors.glassBorder, borderRadius: radius }]}>
        <BlurView intensity={intensity} tint={colors.blurTint} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  wrapper: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
});
