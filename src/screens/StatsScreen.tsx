import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/Task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORY_MAP } from '../constants/taskMeta';
import { getCompletionStats } from '../utils/statsUtils';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const BAR_HEIGHT = 90;

function DayBar({ label, count, max, color, trackColor, index }: { label: string; count: number; max: number; color: string; trackColor: string; index: number }) {
  const height = useSharedValue(0);
  const target = max === 0 ? 0 : Math.max(count > 0 ? 6 : 2, (count / max) * BAR_HEIGHT);

  useEffect(() => {
    height.value = withDelay(index * 60, withTiming(target, { duration: 500, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.barColumn}>
      <View style={[styles.barTrack, { height: BAR_HEIGHT, backgroundColor: trackColor }]}>
        <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
      </View>
      <Text style={styles.barCount}>{count > 0 ? count : ''}</Text>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen(_props: Props) {
  const { tasks } = useTasks();
  const { colors } = useTheme();
  const stats = useMemo(() => getCompletionStats(tasks), [tasks]);
  const maxDayCount = Math.max(1, ...stats.last7Days.map((d) => d.count));

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.ringCard}>
          <ProgressRing progress={stats.completionRate} size={140} strokeWidth={14} color={colors.primary} trackColor={colors.surfaceAlt}>
            <Text style={[styles.ringPercent, { color: colors.text }]}>{Math.round(stats.completionRate * 100)}%</Text>
            <Text style={[styles.ringLabel, { color: colors.textMuted }]}>complete</Text>
          </ProgressRing>
          <Text style={[styles.ringSummary, { color: colors.textSecondary }]}>
            {stats.completedTasks} of {stats.totalTasks} tasks done overall
          </Text>
        </GlassCard>

        <View style={styles.statRow}>
          <GlassCard style={styles.statTile}>
            <Ionicons name="flame" size={22} color={colors.overdue} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>day streak</Text>
          </GlassCard>
          <GlassCard style={styles.statTile}>
            <Ionicons name="today-outline" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.completedToday}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>done today</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.chartCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Last 7 days</Text>
          <View style={styles.chartRow}>
            {stats.last7Days.map((d, i) => (
              <DayBar
                key={d.dateKey}
                label={d.label}
                count={d.count}
                max={maxDayCount}
                color={colors.primary}
                trackColor={colors.surfaceAlt}
                index={i}
              />
            ))}
          </View>
        </GlassCard>

        {stats.categoryBreakdown.length > 0 && (
          <GlassCard style={styles.categoryCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>By category</Text>
            {stats.categoryBreakdown.map((c) => {
              const meta = CATEGORY_MAP[c.category];
              const pct = c.total === 0 ? 0 : c.completed / c.total;
              return (
                <View key={c.category} style={styles.categoryRow}>
                  <View style={styles.categoryHeader}>
                    <Ionicons name={meta.icon} size={14} color={meta.color} />
                    <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>{meta.label}</Text>
                    <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                      {c.completed}/{c.total}
                    </Text>
                  </View>
                  <View style={[styles.categoryTrack, { backgroundColor: colors.surfaceAlt }]}>
                    <View style={[styles.categoryFill, { backgroundColor: meta.color, width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60, gap: 14 },
  ringCard: { alignItems: 'center', gap: 12 },
  ringPercent: { fontSize: 20, fontWeight: '800' },
  ringLabel: { fontSize: 11, fontWeight: '600' },
  ringSummary: { fontSize: 13, fontWeight: '500' },
  statRow: { flexDirection: 'row', gap: 14 },
  statTile: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  chartCard: { gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barColumn: { alignItems: 'center', flex: 1, gap: 4 },
  barTrack: { width: 18, borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 9 },
  barCount: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', minHeight: 12 },
  barLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  categoryCard: { gap: 14 },
  categoryRow: { gap: 6 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  categoryCount: { fontSize: 12, fontWeight: '600' },
  categoryTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 3 },
});
