/**
 * Core data model for the app.
 */
export type Priority = 'none' | 'low' | 'medium' | 'high';

export type CategoryId = 'personal' | 'work' | 'shopping' | 'health' | 'learning' | 'other';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string, set when marked complete (drives stats/streaks)
  dueDate?: string; // ISO string, optional
  priority: Priority;
  category: CategoryId;
  subtasks: Subtask[];
}

/** Payload used when creating or editing a task from the Add/Edit screen or voice input. */
export interface NewTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  category?: CategoryId;
  subtasks?: Subtask[];
}

/** Sorting options for the task list. */
export type SortOption = 'createdDesc' | 'createdAsc' | 'dueDateAsc' | 'dueDateDesc' | 'alphabetical' | 'priority';

/** Completion-status filter for the task list. */
export type FilterOption = 'all' | 'active' | 'completed';

export type ThemeMode = 'light' | 'dark';

/** Navigation param list shared across the app's stack navigator. */
export type RootStackParamList = {
  TaskList: undefined;
  AddTask: { taskId?: string; prefillTitle?: string } | undefined;
  Stats: undefined;
};
