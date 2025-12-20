import { create } from 'zustand';
import { db, FSNode } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';
import { useAuthStore } from './useAuthStore';

interface FolderState {
  nodes: FSNode[];
  loading: boolean;
  currentFolderId: string;
  setCurrentFolderId: (id: string) => void;
  fetchNodes: () => Promise<void>;
  addFolder: (name: string, parentId: string, type: 'note' | 'task') => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  moveNode: (id: string, newParentId: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  nodes: [],
  loading: false,
  currentFolderId: 'root_notes',

  setCurrentFolderId: (id) => set({ currentFolderId: id }),

  fetchNodes: async () => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    set({ loading: true });
    const encryptedNodes = await db.fs_nodes.toArray();
    const nodes = encryptedNodes
      .map(n => decrypt(n.data, password))
      .filter(Boolean) as FSNode[];
    
    set({ nodes, loading: false });
  },

  addFolder: async (name, parentId) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const id = `folder-${Date.now()}`;
    const newNode: FSNode = {
      id,
      parentId,
      type: 'folder',
      name,
      order: Date.now(),
      itemRefId: 0
    };

    const encryptedData = encrypt(newNode, password);
    await db.fs_nodes.put({ id, data: encryptedData });
    await get().fetchNodes();
  },

  deleteNode: async (id) => {
    const { nodes } = get();
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;

    // Recursive deletion logic
    const deleteRecursive = async (nodeId: string) => {
      const children = nodes.filter(n => n.parentId === nodeId);
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type !== 'folder') {
        if (node.type === 'note') await db.notes.delete(node.itemRefId);
        if (node.type === 'task') await db.tasks.delete(node.itemRefId);
      }
      await db.fs_nodes.delete(nodeId);
    };

    await deleteRecursive(id);
    await get().fetchNodes();
  },

  moveNode: async (id, newParentId) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const encryptedNode = await db.fs_nodes.get(id);
    if (encryptedNode) {
      const node = decrypt(encryptedNode.data, password) as FSNode;
      node.parentId = newParentId;
      const encryptedUpdatedNode = encrypt(node, password);
      await db.fs_nodes.put({ id, data: encryptedUpdatedNode });
      await get().fetchNodes();
    }
  }
}));
