import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import ScalePressable from './ScalePressable';

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search tasks…' }: SearchBarProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: focus.value > 0.5 ? colors.primary : colors.border,
    transform: [{ scale: 1 + focus.value * 0.01 }],
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.surfaceAlt }, containerStyle]}>
      <Ionicons name="search" size={18} color={focused ? colors.primary : colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        testID="search-input"
        returnKeyType="search"
        autoCorrect={false}
        onFocus={() => {
          setFocused(true);
          focus.value = withTiming(1, { duration: 160 });
        }}
        onBlur={() => {
          setFocused(false);
          focus.value = withTiming(0, { duration: 160 });
        }}
      />
      {value.length > 0 && (
        <ScalePressable onPress={() => onChange('')} hitSlop={8} testID="search-clear">
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </ScalePressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
