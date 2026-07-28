import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { FilterOption, SortOption } from '../types/Task';
import ScalePressable from './ScalePressable';

interface FilterSortBarProps {
  filter: FilterOption;
  onFilterChange: (f: FilterOption) => void;
  sort: SortOption;
  onCycleSort: () => void;
}

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const SORT_LABELS: Record<SortOption, string> = {
  createdDesc: 'Newest first',
  createdAsc: 'Oldest first',
  dueDateAsc: 'Due date ↑',
  dueDateDesc: 'Due date ↓',
  alphabetical: 'A → Z',
  priority: 'Priority',
};

/** Status filter chips + a tappable sort control that cycles through sort modes. */
export default function FilterSortBar({ filter, onFilterChange, sort, onCycleSort }: FilterSortBarProps) {
  const { colors } = useTheme();

  const selectFilter = (f: FilterOption) => {
    Haptics.selectionAsync().catch(() => undefined);
    onFilterChange(f);
  };

  const cycleSort = () => {
    Haptics.selectionAsync().catch(() => undefined);
    onCycleSort();
  };

  return (
    <View style={styles.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <ScalePressable key={f.key} onPress={() => selectFilter(f.key)} testID={`filter-${f.key}`}>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ color: active ? colors.primaryText : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                  {f.label}
                </Text>
              </View>
            </ScalePressable>
          );
        })}
      </ScrollView>

      <ScalePressable onPress={cycleSort} testID="sort-button">
        <View style={[styles.sortButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
          <Text style={[styles.sortText, { color: colors.textSecondary }]}>{SORT_LABELS[sort]}</Text>
        </View>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  chipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
