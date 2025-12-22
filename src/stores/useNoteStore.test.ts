import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNoteStore } from './useNoteStore';
import { db } from '../db/db';
import { decrypt } from '../utils/encryption';

// Mock DB
vi.mock('../db/db', () => ({
  db: {
    notes: {
      toArray: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(1),
      get: vi.fn(),
      delete: vi.fn(),
    },
    fs_nodes: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock AuthStore
vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ password: 'test-password' }),
  },
}));

describe('useNoteStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNoteStore.setState({ notes: [], loading: false, searchQuery: '' });
  });

  it('addNote encrypts data and saves to DB', async () => {
    const title = 'Secret Note';
    const content = 'This is confidential';
    const tags: string[] = [];
    const parentId = 'root';
    const password = 'test-password';

    await useNoteStore.getState().addNote(title, content, tags, parentId);

    // Verify DB calls
    expect(db.notes.put).toHaveBeenCalledTimes(1);
    expect(db.fs_nodes.put).toHaveBeenCalledTimes(1);

    // Verify Encryption
    const putCall = vi.mocked(db.notes.put).mock.calls[0][0];
    const decryptedNote = decrypt(putCall.data, password);
    
    expect(decryptedNote).toBeTruthy();
    expect(decryptedNote.title).toBe(title);
    expect(decryptedNote.content).toBe(content);
  });
});
