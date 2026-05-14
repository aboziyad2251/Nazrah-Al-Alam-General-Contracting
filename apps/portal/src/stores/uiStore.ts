import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  locale: 'en' | 'ar';
  dir: 'ltr' | 'rtl';
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setLocale: (locale: 'en' | 'ar') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: 'en',
      dir: 'ltr',
      sidebarOpen: true,
      theme: 'light',

      setLocale: (locale) => set({ locale, dir: locale === 'ar' ? 'rtl' : 'ltr' }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'nazrah-ui' }
  )
);
