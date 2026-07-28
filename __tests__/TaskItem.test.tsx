import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskItem from '../src/components/TaskItem';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { Task } from '../src/types/Task';

const baseTask: Task = {
  id: '1',
  title: 'Buy milk',
  description: 'Whole milk, 2 liters',
  completed: false,
  createdAt: new Date().toISOString(),
  priority: 'none',
  category: 'personal',
  subtasks: [],
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('TaskItem', () => {
  it('renders the task title and description', () => {
    const { getByText } = renderWithTheme(
      <TaskItem task={baseTask} onToggle={jest.fn()} onDelete={jest.fn()} onPress={jest.fn()} />
    );
    expect(getByText('Buy milk')).toBeTruthy();
    expect(getByText('Whole milk, 2 liters')).toBeTruthy();
  });

  it('calls onToggle with the task id when the checkbox is pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = renderWithTheme(
      <TaskItem task={baseTask} onToggle={onToggle} onDelete={jest.fn()} onPress={jest.fn()} />
    );
    fireEvent.press(getByTestId(`task-checkbox-${baseTask.id}`));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete with the task id when the delete button is pressed', () => {
    const onDelete = jest.fn();
    const { getByTestId } = renderWithTheme(
      <TaskItem task={baseTask} onToggle={jest.fn()} onDelete={onDelete} onPress={jest.fn()} />
    );
    fireEvent.press(getByTestId(`task-delete-${baseTask.id}`));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onPress with the task id when the row body is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <TaskItem task={baseTask} onToggle={jest.fn()} onDelete={jest.fn()} onPress={onPress} />
    );
    fireEvent.press(getByTestId(`task-open-${baseTask.id}`));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('shows a due date label when the task has a due date', () => {
    const withDueDate: Task = { ...baseTask, dueDate: new Date().toISOString() };
    const { getByText } = renderWithTheme(
      <TaskItem task={withDueDate} onToggle={jest.fn()} onDelete={jest.fn()} onPress={jest.fn()} />
    );
    expect(getByText(/Today/)).toBeTruthy();
  });

  it('shows subtask progress when the task has subtasks', () => {
    const withSubtasks: Task = {
      ...baseTask,
      subtasks: [
        { id: 's1', title: 'Step 1', completed: true },
        { id: 's2', title: 'Step 2', completed: false },
      ],
    };
    const { getByText } = renderWithTheme(
      <TaskItem task={withSubtasks} onToggle={jest.fn()} onDelete={jest.fn()} onPress={jest.fn()} />
    );
    expect(getByText('1/2')).toBeTruthy();
  });
});
