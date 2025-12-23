import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFolderStore } from './useFolderStore';
import { db } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';

// Mock DB
vi.mock('../db/db', () => ({
  db: {
    fs_nodes: {
      toArray: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue('id'),
      get: vi.fn(),
      delete: vi.fn(),
    },
    notes: {
      delete: vi.fn(),
    },
    tasks: {
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

// Mock Worker
vi.mock('../workers/decryption.worker.ts?worker', () => {
  return {
    default: class {
      onmessage: (e: any) => void = () => {};
      postMessage(data: any) {
        // Simulate worker behavior
        setTimeout(() => {
          const { items, type } = data;
          const decrypted = items.map((i: any) => decrypt(i.data, 'test-password'));
          this.onmessage({ data: { type, data: decrypted } });
        }, 0);
      }
      terminate() {}
    }
  };
});

describe('useFolderStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFolderStore.setState({ nodes: [], loading: false, currentFolderId: 'root_notes' });
  });

  it('renameNode updates the name of an existing node', async () => {
    const password = 'test-password';
    const nodeId = 'folder-123';
    const oldName = 'Old Folder Name';
    const newName = 'New Folder Name';
    
    const mockNode = {
      id: nodeId,
      parentId: 'root_notes',
      type: 'folder',
      name: oldName,
      order: 1,
      itemRefId: 0
    };

    // Setup: mock db.fs_nodes.get to return encrypted old node
    vi.mocked(db.fs_nodes.get).mockResolvedValue({
      id: nodeId,
      data: encrypt(mockNode, password)
    });

    // Execute
    // @ts-ignore - renameNode doesn't exist yet
    await useFolderStore.getState().renameNode(nodeId, newName);

    // Verify
    expect(db.fs_nodes.get).toHaveBeenCalledWith(nodeId);
    expect(db.fs_nodes.put).toHaveBeenCalledTimes(1);

    const putCall = vi.mocked(db.fs_nodes.put).mock.calls[0][0];
    const decryptedNode = decrypt(putCall.data, password);
    
    expect(decryptedNode).toBeTruthy();
    expect(decryptedNode.id).toBe(nodeId);
    expect(decryptedNode.name).toBe(newName);
  });
});
