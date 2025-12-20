import { create } from 'zustand';
import { db, Note, FSNode } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';
import { useAuthStore } from './useAuthStore';

interface NoteState {
  notes: Note[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchNotes: () => Promise<void>;
  addNote: (title: string, content: string, tags: string[], parentId: string) => Promise<void>;
  updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: number, nodeId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchNotes: async () => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    set({ loading: true });
    const encryptedNotes = await db.notes.toArray();
    const notes = encryptedNotes
      .map(n => decrypt(n.data, password))
      .filter(Boolean) as Note[];
    
    set({ notes, loading: false });
  },

  addNote: async (title, content, tags, parentId) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const id = Date.now();
    const note: Note = {
      id,
      title,
      content,
      tags,
      updatedAt: new Date().toISOString(),
      order: id
    };

    const encryptedData = encrypt(note, password);
    await db.notes.put({ id, data: encryptedData });

    const fsNode: FSNode = {
      id: `note-${id}`,
      parentId,
      type: 'note',
      name: title,
      order: id,
      itemRefId: id
    };
    const encryptedNode = encrypt(fsNode, password);
    await db.fs_nodes.put({ id: fsNode.id, data: encryptedNode });

    await get().fetchNotes();
  },

  updateNote: async (id, updates) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const encryptedOld = await db.notes.get(id);
    if (encryptedOld) {
      const oldNote = decrypt(encryptedOld.data, password) as Note;
      const updatedNote = { ...oldNote, ...updates, updatedAt: new Date().toISOString() };
      const encryptedData = encrypt(updatedNote, password);
      await db.notes.put({ id, data: encryptedData });

      // Update FSNode name if title changed
      if (updates.title) {
        const nodeId = `note-${id}`;
        const encryptedNode = await db.fs_nodes.get(nodeId);
        if (encryptedNode) {
          const node = decrypt(encryptedNode.data, password) as FSNode;
          node.name = updates.title;
          await db.fs_nodes.put({ id: nodeId, data: encrypt(node, password) });
        }
      }
      await get().fetchNotes();
    }
  },

  deleteNote: async (id, nodeId) => {
    await db.notes.delete(id);
    await db.fs_nodes.delete(nodeId);
    await get().fetchNotes();
  }
}));
