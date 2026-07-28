import 'react-native-get-random-values';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NewTaskInput, Subtask, Task } from '../types/Task';
import { StorageService } from '../services/storageService';

interface TaskContextValue {
  tasks: Task[];
  isHydrating: boolean;
  addTask: (input: NewTaskInput) => Task;
  addTasksBulk: (inputs: NewTaskInput[]) => Task[];
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, changes: Partial<NewTaskInput>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

function buildTask(input: NewTaskInput, createdAt: string): Task {
  return {
    id: uuidv4(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    dueDate: input.dueDate,
    completed: false,
    createdAt,
    priority: input.priority ?? 'none',
    category: input.category ?? 'personal',
    subtasks: input.subtasks ?? [],
  };
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const hasHydrated = useRef(false);

  // Load persisted tasks once on mount.
  useEffect(() => {
    (async () => {
      const loaded = await StorageService.loadTasks();
      setTasks(loaded);
      hasHydrated.current = true;
      setIsHydrating(false);
    })();
  }, []);

  // Persist to AsyncStorage any time the task list changes (after initial load).
  useEffect(() => {
    if (!hasHydrated.current) return;
    StorageService.saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((input: NewTaskInput): Task => {
    const newTask = buildTask(input, new Date().toISOString());
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  // Used by the voice-input flow, which can produce several tasks from one
  // dictation (e.g. "Buy provisions and call mom" -> two tasks).
  const addTasksBulk = useCallback((inputs: NewTaskInput[]): Task[] => {
    const now = new Date().toISOString();
    const newTasks: Task[] = inputs.map((input) => buildTask(input, now));
    setTasks((prev) => [...newTasks, ...prev]);
    return newTasks;
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined };
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<NewTaskInput>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...changes,
              title: changes.title !== undefined ? changes.title.trim() : t.title,
            }
          : t
      )
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks: Subtask[] = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks };
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      isHydrating,
      addTask,
      addTasksBulk,
      toggleComplete,
      deleteTask,
      updateTask,
      toggleSubtask,
    }),
    [tasks, isHydrating, addTask, addTasksBulk, toggleComplete, deleteTask, updateTask, toggleSubtask]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return ctx;
}
