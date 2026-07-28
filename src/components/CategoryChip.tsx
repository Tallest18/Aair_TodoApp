import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CategoryId } from '../types/Task';
import { CATEGORY_MAP } from '../constants/taskMeta';
import ScalePressable from './ScalePressable';

interface CategoryChipProps {
  category: CategoryId;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
}

/**
 * A pill showing a category's icon + label, tinted with that category's own
 * color even when unselected (a soft alpha-blended fill) — so the chip row
 * reads as a row of distinct, colorful categories at a glance rather than a
 * row of identical gray pills. Used both as a tappable filter chip
 * (`onPress` + `selected`) and as a static badge on a task row (omit
 * `onPress`).
 */
export default function CategoryChip({ category, selected, onPress, testID }: CategoryChipProps) {
  const meta = CATEGORY_MAP[category];
  const interactive = !!onPress;

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? meta.color : `${meta.color}26`,
          borderColor: selected ? meta.color : `${meta.color}55`,
        },
      ]}
    >
      <Ionicons name={meta.icon} size={13} color={selected ? '#fff' : meta.color} />
      <Text style={[styles.label, { color: selected ? '#fff' : meta.color }]}>{meta.label}</Text>
    </View>
  );

  if (!interactive) return content;

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => undefined);
    onPress?.();
  };

  return (
    <ScalePressable onPress={handlePress} testID={testID} hitSlop={4}>
      {content}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
