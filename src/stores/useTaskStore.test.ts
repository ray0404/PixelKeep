import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from './useTaskStore';
import { db } from '../db/db';
import { encrypt } from '../utils/encryption';

vi.mock('../db/db', () => ({
  db: {
    tasks: {
      toArray: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    },
    fs_nodes: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    }
  }
}));

vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ password: 'test-password' }))
  }
}));

// Mock Worker
vi.mock('../workers/decryption.worker.ts?worker', () => {
  return {
    default: class {
      onmessage: (e: any) => void = () => {};
      postMessage(data: any) {
        // Simulate worker behavior
        setTimeout(() => {
          const { items, type } = data;
          const { decrypt } = require('../utils/encryption');
          const decrypted = items.map((i: any) => decrypt(i.data, 'test-password'));
          this.onmessage({ data: { type, data: decrypted } });
        }, 0);
      }
      terminate() {}
    }
  };
});

describe('useTaskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({ tasks: [], loading: false });
  });

  it('adds a task incrementally without full fetch', async () => {
    const addTask = useTaskStore.getState().addTask;
    const taskData = { title: 'New Quest' };
    
    await addTask(taskData, 'root');
    
    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('New Quest');
    expect(db.tasks.put).toHaveBeenCalled();
    expect(db.fs_nodes.put).toHaveBeenCalled();
  });

  it('toggles a task incrementally', async () => {
    const initialTask = { id: 1, title: 'Quest', completed: false, alarm: { enabled: false } };
    useTaskStore.setState({ tasks: [initialTask as any] });
    
    // Mock db.tasks.get for the internal toggleTask logic
    vi.mocked(db.tasks.get).mockResolvedValue({
      id: 1,
      data: encrypt(initialTask, 'test-password')
    });

    await useTaskStore.getState().toggleTask(1);
    
    const tasks = useTaskStore.getState().tasks;
    expect(tasks[0].completed).toBe(true);
    expect(db.tasks.put).toHaveBeenCalled();
  });

  it('updates a task incrementally', async () => {
    const initialTask = { id: 1, title: 'Old Title', completed: false, alarm: { enabled: false } };
    useTaskStore.setState({ tasks: [initialTask as any] });
    
    vi.mocked(db.tasks.get).mockResolvedValue({
      id: 1,
      data: encrypt(initialTask, 'test-password')
    });

    await useTaskStore.getState().updateTask(1, { title: 'New Title' });
    
    const tasks = useTaskStore.getState().tasks;
    expect(tasks[0].title).toBe('New Title');
  });

  it('deletes a task incrementally', async () => {
    const initialTask = { id: 1, title: 'Quest' };
    useTaskStore.setState({ tasks: [initialTask as any] });
    
    await useTaskStore.getState().deleteTask(1, 'task-1');
    
    expect(useTaskStore.getState().tasks).toHaveLength(0);
    expect(db.tasks.delete).toHaveBeenCalledWith(1);
  });
});
