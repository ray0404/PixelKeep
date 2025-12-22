import { create } from 'zustand';

interface MovingItemsState {
  ids: string[] | number[];
  type: 'note' | 'task' | 'folder';
  source: 'list' | 'sidebar';
}

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  movingItems: MovingItemsState | null;
  setMovingItems: (items: MovingItemsState | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activePage: 'notes',
  setActivePage: (page) => set({ activePage: page }),
  movingItems: null,
  setMovingItems: (items) => set({ movingItems: items }),
}));
