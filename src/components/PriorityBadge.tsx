import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Priority } from '../types/Task';
import { PRIORITY_MAP } from '../constants/taskMeta';

interface PriorityBadgeProps {
  priority: Priority;
  compact?: boolean;
}

/** A small colored dot + label representing a task's priority. Renders nothing for 'none'. */
export default function PriorityBadge({ priority, compact }: PriorityBadgeProps) {
  if (priority === 'none') return null;
  const meta = PRIORITY_MAP[priority];

  return (
    <View style={[styles.row, compact && styles.compact]} testID={`priority-badge-${priority}`}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      {!compact && <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compact: {
    gap: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
