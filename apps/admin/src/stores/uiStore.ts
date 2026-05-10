import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      commandPaletteOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
    }),
    {
      name: 'nazrah-admin-ui',
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen }),
    }
  )
);
