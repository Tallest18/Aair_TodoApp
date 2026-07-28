import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import ScalePressable from './ScalePressable';

export default function ThemeToggle() {
  const { mode, toggleTheme, colors } = useTheme();
  const rotation = useSharedValue(mode === 'dark' ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(mode === 'dark' ? 1 : 0, { duration: 350 });
  }, [mode, rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    toggleTheme();
  };

  return (
    <ScalePressable onPress={handlePress} hitSlop={10} testID="theme-toggle" style={styles.button}>
      <Animated.View style={style}>
        <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={22} color={colors.text} />
      </Animated.View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 4,
  },
});
