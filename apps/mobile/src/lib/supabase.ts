import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const webStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Typed helpers ─────────────────────────────────────────────────────────────
export type EquipmentRow = {
  id: number;
  model_name: string;
  brand: string;
  category: string;
  daily_rate_sar: number;
  status: string;
  image_url: string | null;
  description: string | null;
};

export type BookingRow = {
  id: number;
  status: string;
  delivery_address: string | null;
  delivery_date: string | null;
  return_date: string | null;
  created_at: string;
  quotes: { project_name: string } | null;
  booking_assignments: { equipment: Pick<EquipmentRow, 'model_name' | 'brand'> }[];
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  full_name_ar: string | null;
  phone: string | null;
  company: string | null;
  role: string;
  locale: string;
  push_token: string | null;
};
