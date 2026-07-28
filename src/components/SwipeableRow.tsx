import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SWIPE_THRESHOLD = 96;
const MAX_SWIPE = 140;

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeComplete?: () => void;
  onSwipeDelete?: () => void;
  completeColor: string;
  deleteColor: string;
  disabled?: boolean;
}

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/**
 * Wraps a row with swipe-right-to-complete / swipe-left-to-delete gestures.
 * Colored action panels fade in behind the row as it's dragged, and a light
 * haptic fires the instant the drag crosses the action threshold so the user
 * feels the exact point where releasing will trigger the action.
 */
export default function SwipeableRow({
  children,
  onSwipeComplete,
  onSwipeDelete,
  completeColor,
  deleteColor,
  disabled,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      const pastThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      if (pastThreshold && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (!pastThreshold && hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd((event) => {
      const shouldComplete = event.translationX > SWIPE_THRESHOLD;
      const shouldDelete = event.translationX < -SWIPE_THRESHOLD;
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      if (shouldComplete && onSwipeComplete) runOnJS(onSwipeComplete)();
      if (shouldDelete && onSwipeDelete) runOnJS(onSwipeDelete)();
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, translateX.value)) }],
  }));

  const completeBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.actionBg, styles.completeBg, { backgroundColor: completeColor }, completeBgStyle]}
      >
        <Ionicons name="checkmark-circle" size={26} color="#fff" />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.actionBg, styles.deleteBg, { backgroundColor: deleteColor }, deleteBgStyle]}
      >
        <Ionicons name="trash" size={24} color="#fff" />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  actionBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    justifyContent: 'center',
  },
  completeBg: {
    alignItems: 'flex-start',
    paddingLeft: 24,
  },
  deleteBg: {
    alignItems: 'flex-end',
    paddingRight: 24,
  },
});
