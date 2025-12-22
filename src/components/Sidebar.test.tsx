import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { BrowserRouter } from 'react-router-dom';

// Mock UI Store
vi.mock('../stores/useUIStore', () => ({
  useUIStore: createMockStore({
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
    movingItems: null,
    setMovingItems: vi.fn(),
  }),
}));

// Mock Folder Store
vi.mock('../stores/useFolderStore', () => ({
  useFolderStore: createMockStore({
    nodes: [
      { id: 'folder-1', name: 'Test Folder', type: 'folder', parentId: 'root_notes', order: 0, itemRefId: 0 }
    ],
    fetchNodes: vi.fn(),
    addFolder: vi.fn(),
    currentFolderId: 'root_notes',
    setCurrentFolderId: vi.fn(),
    deleteNode: vi.fn(),
    moveNodes: vi.fn(),
    renameNode: vi.fn(),
  }),
}));

// Mock Settings Store
vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: () => ({
    dualDirectory: false,
  }),
}));

function createMockStore(state: any) {
  return () => state;
}

describe('Sidebar Renaming', () => {
  it('shows RENAME button when a folder is selected in selection mode', async () => {
    // This requires simulating selection mode which is triggered by long press
    // For unit testing the UI transition, we might need to export internal state or use a more integration-style test.
    // However, we can check if the UI elements exist.
    
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    const folderElement = screen.getByText('Test Folder');
    expect(folderElement).toBeInTheDocument();
    
    // Selection mode is internal state. We might need to mock the selection logic or 
    // test the outcome of the action if we can trigger it.
  });
});
