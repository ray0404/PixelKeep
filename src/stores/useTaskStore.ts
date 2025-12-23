import { create } from 'zustand';
import { db, Task, FSNode } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';
import { useAuthStore } from './useAuthStore';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>, parentId: string) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number, nodeId: string) => Promise<void>;
  toggleTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    set({ loading: true });
    const encryptedTasks = await db.tasks.toArray();
    const tasks = encryptedTasks
      .map(n => decrypt(n.data, password))
      .filter(Boolean) as Task[];
    
    set({ tasks, loading: false });
  },

  addTask: async (taskData, parentId) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const id = Date.now();
    const task: Task = {
      id,
      title: taskData.title || 'Untitled Quest',
      time: taskData.time || null,
      completionType: taskData.completionType || 'at',
      startTime: taskData.startTime || null,
      location: taskData.location || '',
      people: taskData.people || '',
      notes: taskData.notes || '',
      completed: false,
      alarm: taskData.alarm || { enabled: false, trigger: 0, repeat: 0 },
      nextAlarmTime: null, // Logic to calculate this should be here
      updatedAt: new Date().toISOString(),
      order: id
    };

    const encryptedData = encrypt(task, password);
    await db.tasks.put({ id, data: encryptedData });

    const fsNode: FSNode = {
      id: `task-${id}`,
      parentId,
      type: 'task',
      name: task.title,
      order: id,
      itemRefId: id
    };
    await db.fs_nodes.put({ id: fsNode.id, data: encrypt(fsNode, password) });

    // Incremental local update instead of full fetch
    set(state => ({
      tasks: [...state.tasks, task]
    }));
  },

  updateTask: async (id, updates) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    // Optimistic local update
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    }));

    const encryptedOld = await db.tasks.get(id);
    if (encryptedOld) {
      const oldTask = decrypt(encryptedOld.data, password) as Task;
      const updatedTask = { ...oldTask, ...updates, updatedAt: new Date().toISOString() };
      await db.tasks.put({ id, data: encrypt(updatedTask, password) });

      if (updates.title) {
        const nodeId = `task-${id}`;
        const encryptedNode = await db.fs_nodes.get(nodeId);
        if (encryptedNode) {
          const node = decrypt(encryptedNode.data, password) as FSNode;
          node.name = updates.title;
          await db.fs_nodes.put({ id: nodeId, data: encrypt(node, password) });
        }
      }
      // Removed full fetchTasks() reload
    }
  },

  deleteTask: async (id, nodeId) => {
    // Immediate local removal
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
    
    await db.tasks.delete(id);
    await db.fs_nodes.delete(nodeId);
  },

  toggleTask: async (id) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    // Optimistic local toggle
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));

    const encrypted = await db.tasks.get(id);
    if (encrypted) {
      const task = decrypt(encrypted.data, password) as Task;
      task.completed = !task.completed;
      await db.tasks.put({ id, data: encrypt(task, password) });
    }
  }
}));
