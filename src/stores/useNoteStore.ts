import { create } from 'zustand';
import { db, Note, FSNode, Asset } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';
import { useAuthStore } from './useAuthStore';

interface NoteState {
  notes: Note[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchNotes: () => Promise<void>;
  addNote: (title: string, content: string, tags: string[], parentId: string, audio?: string) => Promise<void>;
  updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: number, nodeId: string) => Promise<void>;
  saveAsset: (id: string, blob: Blob) => Promise<void>;
  getAsset: (id: string) => Promise<Blob | null>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),

  saveAsset: async (id, blob) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const reader = new FileReader();
    const dataPromise = new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const base64Data = await dataPromise;

    const asset: Asset = {
      id,
      data: encrypt(base64Data, password),
      mimeType: blob.type
    };
    await db.assets.put(asset);
  },

  getAsset: async (id) => {
    const { password } = useAuthStore.getState();
    if (!password) return null;

    const asset = await db.assets.get(id);
    if (!asset) return null;

    const decryptedData = decrypt(asset.data, password) as string;
    if (!decryptedData) return null;

    const res = await fetch(decryptedData);
    return await res.blob();
  },

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

  addNote: async (title, content, tags, parentId, audio) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const id = Date.now();
    const note: Note = {
      id,
      title,
      content,
      tags,
      audio,
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
