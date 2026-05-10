import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  equipment_id: number;
  model_name: string;
  brand: string;
  category: string;
  image_url?: string;
  daily_rate_sar: number;
  qty: number;
  days: number;
  with_operator: boolean;
}

interface CartState {
  items: CartItem[];
  projectName: string;
  projectLocation: string;
  startDate: string;
  endDate: string;
  step: number;
  addItem: (item: CartItem) => void;
  removeItem: (equipment_id: number) => void;
  updateItem: (equipment_id: number, patch: Partial<CartItem>) => void;
  setProjectInfo: (info: {
    projectName?: string;
    projectLocation?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  setStep: (step: number) => void;
  clearCart: () => void;
  totalSAR: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      projectName: '',
      projectLocation: '',
      startDate: '',
      endDate: '',
      step: 0,

      addItem: (item) => {
        const exists = get().items.find((i) => i.equipment_id === item.equipment_id);
        if (exists) {
          set((s) => ({
            items: s.items.map((i) =>
              i.equipment_id === item.equipment_id ? { ...i, qty: i.qty + 1 } : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, item] }));
        }
      },

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.equipment_id !== id) })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.equipment_id === id ? { ...i, ...patch } : i)),
        })),

      setProjectInfo: (info) => set(info),
      setStep: (step) => set({ step }),

      clearCart: () =>
        set({
          items: [],
          projectName: '',
          projectLocation: '',
          startDate: '',
          endDate: '',
          step: 0,
        }),

      totalSAR: () => get().items.reduce((sum, i) => sum + i.daily_rate_sar * i.qty * i.days, 0),
    }),
    { name: 'nazrah-cart' }
  )
);
