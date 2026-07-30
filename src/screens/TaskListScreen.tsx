import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CategoryId, FilterOption, RootStackParamList, SortOption, Task } from '../types/Task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, PRIORITY_MAP } from '../constants/taskMeta';
import { MAX_CONTENT_WIDTH } from '../constants/layout';
import { getCompletionStats } from '../utils/statsUtils';
import TaskItem from '../components/TaskItem';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import FilterSortBar from '../components/FilterSortBar';
import CategoryChip from '../components/CategoryChip';
import FAB from '../components/FAB';
import ThemeToggle from '../components/ThemeToggle';
import ScalePressable from '../components/ScalePressable';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';
import ConfettiBurst from '../components/ConfettiBurst';
import { useVoiceInput } from '../services/voiceService';
import { splitDictationIntoTasks } from '../utils/taskSplitter';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskList'>;

const SORT_CYCLE: SortOption[] = ['createdDesc', 'createdAsc', 'dueDateAsc', 'dueDateDesc', 'priority', 'alphabetical'];

export default function TaskListScreen({ navigation }: Props) {
  const { tasks, isHydrating, toggleComplete, deleteTask, addTasksBulk } = useTasks();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('createdDesc');
  const [lastVoiceTasks, setLastVoiceTasks] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const wasAllDoneRef = useRef(false);

  const handleFinalTranscript = (transcript: string) => {
    const splitTitles = splitDictationIntoTasks(transcript);
    if (splitTitles.length === 0) return;
    const created = addTasksBulk(splitTitles.map((title) => ({ title })));
    setLastVoiceTasks(created.map((t) => t.title));
  };

  const { status, start, stop, errorMessage, isAvailable } = useVoiceInput(handleFinalTranscript);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <ScalePressable
            onPress={() => navigation.navigate('Stats')}
            hitSlop={10}
            testID="header-stats-button"
            style={styles.headerIconButton}
          >
            <Ionicons name="stats-chart" size={21} color={colors.text} />
          </ScalePressable>
          <ThemeToggle />
          <ScalePressable onPress={() => navigation.navigate('AddTask')} hitSlop={10} testID="header-add-button">
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </ScalePressable>
        </View>
      ),
    });
  }, [navigation, colors.primary, colors.text]);

  const handleFabPress = async () => {
    if (!isAvailable) {
      Alert.alert(
        'Voice input unavailable',
        'On-device speech recognition needs a custom dev build (not Expo Go). See README.md for setup instructions.'
      );
      return;
    }
    if (status === 'listening') {
      await stop();
    } else {
      setLastVoiceTasks([]);
      await start();
    }
  };

  // Celebrate the moment every task in the list becomes completed.
  useEffect(() => {
    const allDone = tasks.length > 0 && tasks.every((t) => t.completed);
    if (allDone && !wasAllDoneRef.current) {
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    wasAllDoneRef.current = allDone;
  }, [tasks]);

  const stats = useMemo(() => getCompletionStats(tasks), [tasks]);

  const filteredSortedTasks = useMemo(() => {
    let result: Task[] = tasks;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
      );
    }

    if (filter === 'active') result = result.filter((t) => !t.completed);
    if (filter === 'completed') result = result.filter((t) => t.completed);

    if (categoryFilter !== 'all') result = result.filter((t) => t.category === categoryFilter);

    const sorted = [...result].sort((a, b) => {
      switch (sort) {
        case 'createdAsc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'createdDesc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'priority':
          return PRIORITY_MAP[b.priority].weight - PRIORITY_MAP[a.priority].weight;
        case 'dueDateAsc':
        case 'dueDateDesc': {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return sort === 'dueDateAsc' ? aTime - bTime : bTime - aTime;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, query, filter, categoryFilter, sort]);

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sort);
    setSort(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  const openTask = (id: string) => navigation.navigate('AddTask', { taskId: id });

  if (isHydrating) {
    return (
      <GradientBackground>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </GradientBackground>
    );
  }

  const noTasksAtAll = tasks.length === 0;
  const noResultsFromFilters = !noTasksAtAll && filteredSortedTasks.length === 0;
  const allCompletedNoQuery = !query.trim() && filter === 'active' && tasks.length > 0 && tasks.every((t) => t.completed);

  return (
    <GradientBackground>
      <View style={styles.container}>
      <View style={styles.contentColumn}>
        {!noTasksAtAll && (
          <>
            <GlassCard style={styles.heroCard} radius={22}>
              <ScalePressable onPress={() => navigation.navigate('Stats')} testID="hero-stats-card" style={styles.heroContent}>
                <ProgressRing progress={stats.completionRate} size={60} strokeWidth={6} color={colors.primary} trackColor={colors.surfaceAlt}>
                  <Text style={[styles.heroPercent, { color: colors.text }]}>{Math.round(stats.completionRate * 100)}%</Text>
                </ProgressRing>
                <View style={styles.heroTextBlock}>
                  <Text style={[styles.heroTitle, { color: colors.text }]}>
                    {stats.completedTasks}/{stats.totalTasks} tasks done
                  </Text>
                  <View style={styles.streakRow}>
                    <Ionicons name="flame" size={14} color={colors.overdue} />
                    <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                      {stats.currentStreak > 0 ? `${stats.currentStreak}-day streak` : 'Start a streak today'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </ScalePressable>
            </GlassCard>

            <SearchBar value={query} onChange={setQuery} />
            <FilterSortBar filter={filter} onFilterChange={setFilter} sort={sort} onCycleSort={cycleSort} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryRow}
              testID="category-filter-row"
            >
              <ScalePressable onPress={() => setCategoryFilter('all')} testID="category-filter-all">
                <View
                  style={[
                    styles.allChip,
                    {
                      backgroundColor: categoryFilter === 'all' ? colors.text : colors.surfaceAlt,
                      borderColor: categoryFilter === 'all' ? colors.text : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: categoryFilter === 'all' ? colors.background : colors.textSecondary, fontWeight: '600', fontSize: 12 }}>
                    All categories
                  </Text>
                </View>
              </ScalePressable>
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c.id}
                  category={c.id}
                  selected={categoryFilter === c.id}
                  onPress={() => setCategoryFilter(categoryFilter === c.id ? 'all' : c.id)}
                  testID={`category-filter-${c.id}`}
                />
              ))}
            </ScrollView>
          </>
        )}

        {!!lastVoiceTasks.length && (
          <View style={[styles.voiceBanner, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} testID="voice-result-banner">
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.voiceBannerText, { color: colors.textSecondary }]} numberOfLines={2}>
              Added {lastVoiceTasks.length} task{lastVoiceTasks.length > 1 ? 's' : ''}: {lastVoiceTasks.join(', ')}
            </Text>
          </View>
        )}

        {!!errorMessage && status === 'error' && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
        )}

        {noTasksAtAll ? (
          <EmptyState
            title="No tasks yet"
            subtitle="Tap the + button or the microphone below to add your first task."
            icon="clipboard-outline"
          />
        ) : allCompletedNoQuery && filteredSortedTasks.length === 0 ? (
          <EmptyState title="All done! 🎉" subtitle="Every active task is complete. Enjoy the win." icon="checkmark-done-circle-outline" />
        ) : noResultsFromFilters ? (
          <EmptyState title="No matching tasks" subtitle="Try a different search term or filter." icon="search-outline" />
        ) : (
          <Animated.FlatList
            data={filteredSortedTasks}
            keyExtractor={(item: Task) => item.id}
            renderItem={({ item }: { item: Task }) => (
              <TaskItem task={item} onToggle={toggleComplete} onDelete={confirmDelete} onPress={openTask} />
            )}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            testID="task-list"
          />
        )}
      </View>

      <FAB status={status} onPress={handleFabPress} />

      {showCelebration && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiBurst particleCount={70} minDistance={120} maxDistance={340} onDone={() => setShowCelebration(false)} />
        </View>
      )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentColumn: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingBottom: 120, paddingTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconButton: { padding: 4, marginRight: 4 },
  heroCard: { marginHorizontal: 16, marginTop: 12 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroPercent: { fontSize: 13, fontWeight: '700' },
  heroTextBlock: { flex: 1 },
  heroTitle: { fontSize: 15, fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroSubtitle: { fontSize: 12, fontWeight: '500' },
  categoryScroll: { flexGrow: 0, flexShrink: 0, height: 48, maxHeight: 48 },
  categoryRow: { gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  allChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  voiceBannerText: { fontSize: 12, flex: 1, marginLeft: 6 },
  errorText: { marginHorizontal: 16, marginTop: 8, fontSize: 12 },
});
