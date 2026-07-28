import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/Task';

const TASKS_STORAGE_KEY = '@aair_todo/tasks';

/**
 * Fills in defaults for fields that didn't exist in earlier versions of the
 * app's data model (priority/category/subtasks were added later), so tasks
 * persisted by an older build still load correctly instead of crashing on a
 * missing field.
 */
function migrateTask(raw: any): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    completed: !!raw.completed,
    createdAt: raw.createdAt,
    completedAt: raw.completedAt,
    dueDate: raw.dueDate,
    priority: raw.priority ?? 'none',
    category: raw.category ?? 'personal',
    subtasks: Array.isArray(raw.subtasks) ? raw.subtasks : [],
  };
}

/**
 * Thin wrapper around AsyncStorage so the rest of the app never talks to the
 * storage API directly. Keeping this isolated makes it trivial to swap in
 * another persistence layer (SQLite, MMKV, a backend, etc.) later on.
 */
export const StorageService = {
  async loadTasks(): Promise<Task[]> {
    try {
      const raw = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(migrateTask);
    } catch (error) {
      console.warn('StorageService: failed to load tasks', error);
      return [];
    }
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.warn('StorageService: failed to save tasks', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
    } catch (error) {
      console.warn('StorageService: failed to clear tasks', error);
    }
  },
};
