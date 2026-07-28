import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { VoiceStatus } from '../services/voiceService';
import ScalePressable from './ScalePressable';

interface FABProps {
  status: VoiceStatus;
  onPress: () => void;
}

/**
 * Floating Action Button. Tapping it toggles voice input mode. While
 * listening, the button pulses to give clear visual feedback that the app
 * is recording; while processing the transcript, the icon spins.
 */
export default function FAB({ status, onPress }: FABProps) {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 550, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 550, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isListening, pulse]);

  useEffect(() => {
    if (isProcessing) {
      spin.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.linear }), -1, false);
    } else {
      spin.value = 0;
    }
  }, [isProcessing, spin]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  const icon = isProcessing ? 'sync' : isListening ? 'mic' : 'mic-outline';
  const label = isProcessing ? 'Processing…' : isListening ? 'Listening…' : null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onPress();
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {label && (
        <View style={[styles.label, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.labelText, { color: colors.text }]}>{label}</Text>
        </View>
      )}
      <Animated.View style={pulseStyle}>
        <ScalePressable
          onPress={handlePress}
          testID="voice-fab"
          scaleTo={0.9}
          style={[styles.fab, { shadowColor: colors.fabShadow }]}
        >
          {isListening ? (
            <View style={[styles.fill, { backgroundColor: colors.danger }]} />
          ) : (
            <LinearGradient colors={colors.heroGradient} style={styles.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          )}
          <Animated.View style={spinStyle}>
            <Ionicons name={icon} size={28} color="#fff" />
          </Animated.View>
        </ScalePressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    alignItems: 'flex-end',
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 31,
  },
  label: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
