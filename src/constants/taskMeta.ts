import { Ionicons } from '@expo/vector-icons';
import { CategoryId, Priority } from '../types/Task';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * A fixed, curated category list (rather than free-form user-managed
 * categories) keeps the filter UI and color-coding simple and predictable —
 * every task always has exactly one recognizable category chip.
 */
export const CATEGORIES: CategoryMeta[] = [
  { id: 'personal', label: 'Personal', color: '#818CF8', icon: 'person-outline' },
  { id: 'work', label: 'Work', color: '#38BDF8', icon: 'briefcase-outline' },
  { id: 'shopping', label: 'Shopping', color: '#FB923C', icon: 'cart-outline' },
  { id: 'health', label: 'Health', color: '#4ADE80', icon: 'fitness-outline' },
  { id: 'learning', label: 'Learning', color: '#F472B6', icon: 'book-outline' },
  { id: 'other', label: 'Other', color: '#A1A1AA', icon: 'ellipsis-horizontal-circle-outline' },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CategoryId, CategoryMeta>
);

export interface PriorityMeta {
  id: Priority;
  label: string;
  color: string;
  weight: number; // used for priority-based sorting, higher = more urgent
}

export const PRIORITIES: PriorityMeta[] = [
  { id: 'none', label: 'None', color: '#9CA3AF', weight: 0 },
  { id: 'low', label: 'Low', color: '#38BDF8', weight: 1 },
  { id: 'medium', label: 'Medium', color: '#FBBF24', weight: 2 },
  { id: 'high', label: 'High', color: '#F87171', weight: 3 },
];

export const PRIORITY_MAP: Record<Priority, PriorityMeta> = PRIORITIES.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<Priority, PriorityMeta>
);
