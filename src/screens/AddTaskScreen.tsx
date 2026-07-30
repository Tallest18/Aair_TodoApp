import 'react-native-get-random-values';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CategoryId, NewTaskInput, Priority, RootStackParamList, Subtask } from '../types/Task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, PRIORITIES } from '../constants/taskMeta';
import { MAX_CONTENT_WIDTH } from '../constants/layout';
import CategoryChip from '../components/CategoryChip';
import ScalePressable from '../components/ScalePressable';
import GradientBackground from '../components/GradientBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTask'>;

export default function AddTaskScreen({ navigation, route }: Props) {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { colors } = useTheme();

  const taskId = route.params?.taskId;
  const existingTask = taskId ? tasks.find((t) => t.id === taskId) : undefined;
  const isEditing = !!existingTask;

  const [title, setTitle] = useState(existingTask?.title ?? route.params?.prefillTitle ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [dueDate, setDueDate] = useState<Date | null>(existingTask?.dueDate ? new Date(existingTask.dueDate) : null);
  const [showPicker, setShowPicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>(existingTask?.priority ?? 'none');
  const [category, setCategory] = useState<CategoryId>(existingTask?.category ?? 'personal');
  const [subtasks, setSubtasks] = useState<Subtask[]>(existingTask?.subtasks ?? []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Task' : 'Add Task' });
  }, [navigation, isEditing]);

  const handleSave = () => {
    // Edge case: empty task title.
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Please enter a task title.');
      return;
    }

    const payload: NewTaskInput = {
      title: trimmed,
      description: description.trim() || undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      priority,
      category,
      subtasks,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

    if (isEditing && existingTask) {
      updateTask(existingTask.id, payload);
    } else {
      addTask(payload);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existingTask) return;
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(existingTask.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const onChangeDate = (_event: unknown, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // iOS keeps the inline picker open until dismissed manually.
    if (selected) setDueDate(selected);
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    Haptics.selectionAsync().catch(() => undefined);
    setSubtasks((prev) => [...prev, { id: uuidv4(), title: trimmed, completed: false }]);
    setNewSubtaskText('');
  };

  const toggleLocalSubtask = (id: string) => {
    Haptics.selectionAsync().catch(() => undefined);
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (titleError) setTitleError(null);
            }}
            placeholder="e.g. Buy groceries"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.text, borderColor: titleError ? colors.danger : colors.border },
            ]}
            testID="title-input"
            autoFocus={!isEditing}
            returnKeyType="next"
          />
          {!!titleError && (
            <Text style={[styles.errorText, { color: colors.danger }]} testID="title-error">
              {titleError}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add more detail…"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              styles.multiline,
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
            multiline
            numberOfLines={4}
            testID="description-input"
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const selected = priority === p.id;
              return (
                <ScalePressable key={p.id} onPress={() => setPriority(p.id)} testID={`priority-${p.id}`}>
                  <View
                    style={[
                      styles.priorityPill,
                      { backgroundColor: selected ? p.color : colors.surfaceAlt, borderColor: selected ? p.color : colors.border },
                    ]}
                  >
                    <Text style={{ color: selected ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                      {p.label}
                    </Text>
                  </View>
                </ScalePressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.id}
                category={c.id}
                selected={category === c.id}
                onPress={() => setCategory(c.id)}
                testID={`category-pick-${c.id}`}
              />
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>Due date (optional)</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            testID="due-date-button"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={{ color: dueDate ? colors.text : colors.textMuted, marginLeft: 8 }}>
              {dueDate ? dueDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Set a due date'}
            </Text>
            {dueDate && (
              <Pressable onPress={() => setDueDate(null)} hitSlop={8} style={styles.clearDate} testID="clear-due-date">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
          )}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 18 }]}>Checklist (optional)</Text>
          <View style={styles.subtaskAddRow}>
            <TextInput
              value={newSubtaskText}
              onChangeText={setNewSubtaskText}
              placeholder="Add a checklist item"
              placeholderTextColor={colors.textMuted}
              style={[styles.subtaskInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
              testID="subtask-input"
            />
            <ScalePressable onPress={handleAddSubtask} testID="subtask-add-button">
              <View style={[styles.subtaskAddButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={20} color={colors.primaryText} />
              </View>
            </ScalePressable>
          </View>

          {subtasks.map((s) => (
            <View key={s.id} style={styles.subtaskRow} testID={`subtask-row-${s.id}`}>
              <ScalePressable onPress={() => toggleLocalSubtask(s.id)} testID={`subtask-toggle-${s.id}`}>
                <View
                  style={[
                    styles.subtaskCheckbox,
                    { borderColor: s.completed ? colors.success : colors.textMuted, backgroundColor: s.completed ? colors.success : 'transparent' },
                  ]}
                >
                  {s.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
              </ScalePressable>
              <Text
                style={[styles.subtaskItemText, { color: colors.text }, s.completed && styles.strikethrough]}
                numberOfLines={2}
              >
                {s.title}
              </Text>
              <ScalePressable onPress={() => removeSubtask(s.id)} testID={`subtask-remove-${s.id}`}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </ScalePressable>
            </View>
          ))}

          <ScalePressable onPress={handleSave} testID="save-task-button">
            <View style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>{isEditing ? 'Save Changes' : 'Save Task'}</Text>
            </View>
          </ScalePressable>

          {isEditing && (
            <ScalePressable onPress={handleDelete} testID="delete-task-button">
              <View style={[styles.deleteButton, { borderColor: colors.danger }]}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Task</Text>
              </View>
            </ScalePressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  errorText: { marginTop: 6, fontSize: 12 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryScroll: { flexGrow: 0, flexShrink: 0, height: 48, maxHeight: 48 },
  categoryRow: { gap: 8, paddingRight: 8 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clearDate: { marginLeft: 'auto' },
  subtaskAddRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  subtaskAddButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskItemText: { flex: 1, fontSize: 14 },
  strikethrough: { textDecorationLine: 'line-through' },
  saveButton: {
    marginTop: 32,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '700' },
  deleteButton: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '700' },
});
