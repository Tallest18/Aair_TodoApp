import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#F87171', '#FBBF24', '#4ADE80', '#38BDF8', '#818CF8', '#F472B6'];

interface ParticleProps {
  originX: number;
  originY: number;
  index: number;
  count: number;
  minDistance: number;
  maxDistance: number;
  onDone?: () => void;
}

function Particle({ originX, originY, index, count, minDistance, maxDistance, onDone }: ParticleProps) {
  const progress = useSharedValue(0);
  const angle = (index / count) * Math.PI * 2 + Math.random() * 0.6;
  const distance = minDistance + Math.random() * (maxDistance - minDistance);
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance - 50;
  const rotation = (Math.random() - 0.5) * 720;
  const color = COLORS[index % COLORS.length];
  const size = 6 + Math.random() * 6;
  const delay = Math.random() * 90;
  const duration = 800 + Math.random() * 300;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished && index === count - 1 && onDone) {
          runOnJS(onDone)();
        }
      })
    );
    // Only ever runs once per mounted burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: 1 - p,
      transform: [
        { translateX: targetX * p },
        { translateY: targetY * p + 70 * p * p },
        { rotate: `${rotation * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        style,
        {
          left: originX,
          top: originY,
          width: size,
          height: index % 3 === 0 ? size * 1.6 : size,
          borderRadius: index % 2 === 0 ? size / 2 : 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

interface ConfettiBurstProps {
  originX?: number;
  originY?: number;
  /** Number of confetti pieces. Fewer reads as a subtle accent, more as a full celebration. */
  particleCount?: number;
  /** Min/max travel distance in px, controlling how far the burst spreads. */
  minDistance?: number;
  maxDistance?: number;
  onDone?: () => void;
}

/**
 * A lightweight, dependency-free confetti burst built directly on Reanimated
 * shared values instead of pulling in a dedicated confetti library — keeps
 * the dependency surface small and guarantees Expo Go compatibility (see the
 * lesson learned with an unmaintained native voice module during the SDK 54
 * upgrade). Mount this conditionally (e.g. behind a boolean + `key`) and pass
 * `onDone` to unmount it once the animation finishes.
 */
export default function ConfettiBurst({
  originX,
  originY,
  particleCount = 26,
  minDistance = 90,
  maxDistance = 240,
  onDone,
}: ConfettiBurstProps) {
  const { width, height } = useWindowDimensions();
  const cx = originX ?? width / 2;
  const cy = originY ?? height / 2;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: particleCount }).map((_, i) => (
        <Particle
          key={i}
          originX={cx}
          originY={cy}
          index={i}
          count={particleCount}
          minDistance={minDistance}
          maxDistance={maxDistance}
          onDone={onDone}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
