import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { Task } from '../types/Task';
import { useTheme } from '../theme/ThemeContext';
import { formatDueDate, isOverdue } from '../utils/dateUtils';
import CategoryChip from './CategoryChip';
import PriorityBadge from './PriorityBadge';
import SwipeableRow from './SwipeableRow';
import ConfettiBurst from './ConfettiBurst';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
}

/**
 * Renders a single task row. Completed tasks get a strikethrough title,
 * muted colors, and a filled checkbox. Swipe right to complete, swipe left
 * to delete (see SwipeableRow); tapping the body opens the task for editing.
 */
export default function TaskItem({ task, onToggle, onDelete, onPress }: TaskItemProps) {
  const { colors } = useTheme();
  const [showBurst, setShowBurst] = useState(false);

  const overdue = !task.completed && task.dueDate ? isOverdue(task.dueDate) : false;
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;

  const handleToggle = () => {
    if (!task.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      setShowBurst(true);
    } else {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onToggle(task.id);
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).mass(0.6)}
      exiting={FadeOutLeft.duration(200)}
      layout={LinearTransition.springify().damping(20)}
    >
      <SwipeableRow
        completeColor={colors.success}
        deleteColor={colors.danger}
        onSwipeComplete={!task.completed ? handleToggle : undefined}
        onSwipeDelete={() => onDelete(task.id)}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.cardShadow },
          ]}
          testID={`task-item-${task.id}`}
        >
          <View style={styles.checkboxWrapper}>
            <Pressable
              onPress={handleToggle}
              hitSlop={8}
              testID={`task-checkbox-${task.id}`}
              style={[
                styles.checkbox,
                {
                  borderColor: task.completed ? colors.success : colors.textMuted,
                  backgroundColor: task.completed ? colors.success : 'transparent',
                },
              ]}
            >
              {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </Pressable>
            {showBurst && (
              <View style={styles.burstAnchor} pointerEvents="none">
                <ConfettiBurst
                  originX={12}
                  originY={12}
                  particleCount={14}
                  minDistance={30}
                  maxDistance={70}
                  onDone={() => setShowBurst(false)}
                />
              </View>
            )}
          </View>

          <Pressable style={styles.textContainer} onPress={() => onPress(task.id)} testID={`task-open-${task.id}`}>
            <View style={styles.badgeRow}>
              <CategoryChip category={task.category} />
              <PriorityBadge priority={task.priority} />
            </View>

            <Text
              style={[
                styles.title,
                { color: task.completed ? colors.textMuted : colors.text },
                task.completed && styles.strikethrough,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {!!task.description && (
              <Text
                style={[styles.description, { color: colors.textSecondary }, task.completed && styles.strikethrough]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}

            {subtaskTotal > 0 && (
              <View style={styles.subtaskRow}>
                <View style={[styles.subtaskTrack, { backgroundColor: colors.surfaceAlt }]}>
                  <View
                    style={[
                      styles.subtaskFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.round((subtaskDone / subtaskTotal) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.subtaskText, { color: colors.textMuted }]}>
                  {subtaskDone}/{subtaskTotal}
                </Text>
              </View>
            )}

            {!!task.dueDate && (
              <View style={styles.dueRow}>
                <Ionicons name="calendar-outline" size={13} color={overdue ? colors.overdue : colors.textMuted} />
                <Text style={[styles.dueText, { color: overdue ? colors.overdue : colors.textMuted }]}>
                  {formatDueDate(task.dueDate)}
                  {overdue ? ' · Overdue' : ''}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => onDelete(task.id)}
            hitSlop={10}
            testID={`task-delete-${task.id}`}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </SwipeableRow>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  checkboxWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstAnchor: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  textContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  subtaskTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  subtaskFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtaskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
    marginTop: 2,
  },
});
