import { create } from 'zustand';
import { db, Task, FSNode } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';
import { useAuthStore } from './useAuthStore';
import { useSettingsStore } from './useSettingsStore';
import DecryptionWorker from '../workers/decryption.worker.ts?worker';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>, parentId: string) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number, nodeId: string) => Promise<void>;
  toggleTask: (id: number) => Promise<void>;
}

let worker: Worker | null = null;

const updateBadge = (tasks: Task[]) => {
  if ('setAppBadge' in navigator) {
    const activeCount = tasks.filter(t => !t.completed).length;
    if (activeCount > 0) {
      (navigator as any).setAppBadge(activeCount).catch((e: any) => console.error("Badge set failed:", e));
    } else {
      (navigator as any).clearAppBadge().catch((e: any) => console.error("Badge clear failed:", e));
    }
  }
};

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    set({ loading: true });

    const encryptedTasks = await db.tasks.toArray();

    if (disableTaskEncryption) {
      const tasks = encryptedTasks.map(n => {
        try {
          // Try to parse as JSON first (unencrypted)
          return JSON.parse(n.data);
        } catch (e) {
          // If that fails, it's probably still encrypted, try to decrypt
          return decrypt(n.data, password);
        }
      }).filter(Boolean) as Task[];
      updateBadge(tasks);
      set({ tasks, loading: false });
      return;
    }

    if (!worker) {
      worker = new DecryptionWorker();
    }

    worker.onmessage = (event) => {
      const { data, error } = event.data;
      if (error) {
        console.error("Worker task decryption error:", error);
        set({ loading: false });
        return;
      }
      const tasks = data as Task[];
      updateBadge(tasks);
      set({ tasks, loading: false });
    };

    worker.postMessage({
      items: encryptedTasks,
      password,
      type: 'TASKS'
    });
  },

  addTask: async (taskData, parentId) => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    
    // Only block if encryption is required but no password provided
    if (!disableTaskEncryption && !password) {
      console.error("Encryption enabled but no password available.");
      return;
    }

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

    const dataToStore = disableTaskEncryption ? JSON.stringify(task) : encrypt(task, password!);
    await db.tasks.put({ id, data: dataToStore });

    const fsNode: FSNode = {
      id: `task-${id}`,
      parentId,
      type: 'task',
      name: task.title,
      order: id,
      itemRefId: id
    };
    const nodeDataToStore = disableTaskEncryption ? JSON.stringify(fsNode) : encrypt(fsNode, password!);
    await db.fs_nodes.put({ id: fsNode.id, data: nodeDataToStore });

    // Incremental local update instead of full fetch
    set(state => {
      const newTasks = [...state.tasks, task];
      updateBadge(newTasks);
      return { tasks: newTasks };
    });
  },

  updateTask: async (id, updates) => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    // Optimistic local update
    set(state => {
      const newTasks = state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
      updateBadge(newTasks);
      return { tasks: newTasks };
    });

    const encryptedOld = await db.tasks.get(id);
    if (encryptedOld) {
      let oldTask: Task;
      try {
        oldTask = disableTaskEncryption ? JSON.parse(encryptedOld.data) : decrypt(encryptedOld.data, password);
      } catch (e) {
        // Fallback if toggled recently
        oldTask = decrypt(encryptedOld.data, password);
      }

      if (!oldTask) return;

      const updatedTask = { ...oldTask, ...updates, updatedAt: new Date().toISOString() };
      const dataToStore = disableTaskEncryption ? JSON.stringify(updatedTask) : encrypt(updatedTask, password);
      await db.tasks.put({ id, data: dataToStore });

      if (updates.title) {
        const nodeId = `task-${id}`;
        const encryptedNode = await db.fs_nodes.get(nodeId);
        if (encryptedNode) {
          let node: FSNode;
          try {
            node = disableTaskEncryption ? JSON.parse(encryptedNode.data) : decrypt(encryptedNode.data, password);
          } catch (e) {
            node = decrypt(encryptedNode.data, password);
          }
          if (node) {
            node.name = updates.title;
            const nodeDataToStore = disableTaskEncryption ? JSON.stringify(node) : encrypt(node, password);
            await db.fs_nodes.put({ id: nodeId, data: nodeDataToStore });
          }
        }
      }
      // Removed full fetchTasks() reload
    }
  },

  deleteTask: async (id, nodeId) => {
    // Immediate local removal
    set(state => {
      const newTasks = state.tasks.filter(t => t.id !== id);
      updateBadge(newTasks);
      return { tasks: newTasks };
    });
    
    await db.tasks.delete(id);
    await db.fs_nodes.delete(nodeId);
  },

  toggleTask: async (id) => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    // Optimistic local toggle
    set(state => {
      const newTasks = state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      updateBadge(newTasks);
      return { tasks: newTasks };
    });

    const encrypted = await db.tasks.get(id);
    if (encrypted) {
      let task: Task;
      try {
        task = disableTaskEncryption ? JSON.parse(encrypted.data) : decrypt(encrypted.data, password);
      } catch (e) {
        task = decrypt(encrypted.data, password);
      }

      if (task) {
        task.completed = !task.completed;
        const dataToStore = disableTaskEncryption ? JSON.stringify(task) : encrypt(task, password);
        await db.tasks.put({ id, data: dataToStore });
      }
    }
  }
}));
