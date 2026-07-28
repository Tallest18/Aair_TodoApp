import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

/**
 * Full-screen gradient wash + two soft color "blobs" for depth, used behind
 * every screen. Purely decorative (pointerEvents="none" on the blobs) so it
 * never intercepts touches meant for the real content layered on top.
 */
export default function GradientBackground({ children }: GradientBackgroundProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.blobPrimary, { backgroundColor: colors.blobColors[0] }]} />
      <View pointerEvents="none" style={[styles.blobSecondary, { backgroundColor: colors.blobColors[1] }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blobPrimary: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -80,
    opacity: 0.38,
  },
  blobSecondary: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: 80,
    left: -100,
    opacity: 0.3,
  },
  content: { flex: 1 },
});
