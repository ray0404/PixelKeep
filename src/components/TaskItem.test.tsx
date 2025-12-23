import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from './TaskItem';
import { Task } from '../db/db';

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  time: null,
  completionType: 'at',
  startTime: null,
  location: 'Test Location',
  people: 'Test People',
  notes: 'Test Notes',
  completed: false,
  alarm: { enabled: false, trigger: 0, repeat: 0 },
  nextAlarmTime: null,
  updatedAt: new Date().toISOString(),
  order: 1
};

describe('TaskItem', () => {
  it('renders task details correctly', () => {
    render(
      <TaskItem 
        task={mockTask} 
        nodeId="task-1" 
        onToggle={vi.fn()} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );

    expect(screen.getByText('Test Task')).toBeDefined();
    expect(screen.getByText('Test Location')).toBeDefined();
    expect(screen.getByText('Test People')).toBeDefined();
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(
      <TaskItem 
        task={mockTask} 
        nodeId="task-1" 
        onToggle={onToggle} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('shows and hides notes', () => {
    render(
      <TaskItem 
        task={mockTask} 
        nodeId="task-1" 
        onToggle={vi.fn()} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );

    const expandBtn = screen.getByText('expand_more');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Test Notes')).toBeDefined();
    
    fireEvent.click(screen.getByText('expand_less'));
    expect(screen.queryByText('Test Notes')).toBeNull();
  });
});
