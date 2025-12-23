import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskEditor } from './TaskEditor';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
vi.mock('../stores/useTaskStore', () => ({
  useTaskStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ tasks: [] });
    }
    return {
      tasks: [],
      addTask: vi.fn(),
      updateTask: vi.fn()
    };
  })
}));

vi.mock('../stores/useFolderStore', () => ({
  useFolderStore: vi.fn(() => ({
    currentFolderId: 'root'
  }))
}));

describe('TaskEditor', () => {
  it('updates title input correctly', () => {
    render(
      <MemoryRouter>
        <TaskEditor />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('What needs to be done?') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Quest' } });
    expect(input.value).toBe('New Quest');
  });

  it('updates notes textarea correctly', () => {
    render(
      <MemoryRouter>
        <TaskEditor />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText('Extra details...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Some notes' } });
    expect(textarea.value).toBe('Some notes');
  });
});
