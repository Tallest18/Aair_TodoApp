import React from 'react';
import { GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps {
  onPress?: (event: GestureResponderEvent) => void;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
  hitSlop?: number;
  testID?: string;
}

/**
 * A Pressable that springs to `scaleTo` on press-in and back to 1 on
 * release — used everywhere a tappable element needs a tactile "give" (FAB,
 * chips, buttons) instead of the default flat/no-feedback press.
 */
export default function ScalePressable({
  onPress,
  scaleTo = 0.94,
  style,
  children,
  disabled,
  hitSlop,
  testID,
}: ScalePressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      testID={testID}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
