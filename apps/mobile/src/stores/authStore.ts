import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type ProfileRow } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  initialized: boolean;
  biometricEnabled: boolean;
  biometricLocked: boolean; // session exists but app is locked

  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const BIOMETRIC_KEY = 'nazrah_biometric_enabled';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      profile: null,
      initialized: false,
      biometricEnabled: false,
      biometricLocked: false,

      initialize: async () => {
        // Restore Supabase session from AsyncStorage (handled by supabase client)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const biometricEnabled = (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === 'true';

        set({
          session,
          user: session?.user ?? null,
          initialized: true,
          biometricEnabled,
          // Lock the app if biometric is on and a session exists
          biometricLocked: biometricEnabled && !!session,
        });

        if (session) {
          get().fetchProfile(session.user.id);
        }

        // Keep session in sync on token refresh / sign out
        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null });
          if (session) get().fetchProfile(session.user.id);
        });
      },

      setSession: (session) => set({ session, user: session?.user ?? null }),

      fetchProfile: async (userId) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) set({ profile: data as ProfileRow });
      },

      enableBiometric: async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!compatible || !enrolled) return false;

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm to enable biometric login',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
          set({ biometricEnabled: true });
        }
        return result.success;
      },

      disableBiometric: async () => {
        await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
        set({ biometricEnabled: false });
      },

      unlockWithBiometric: async () => {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: get().profile
            ? `Welcome back, ${get().profile?.full_name ?? ''}`
            : 'Verify your identity',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Sign in instead',
        });

        if (result.success) {
          set({ biometricLocked: false });
        }
        return result.success;
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null, biometricLocked: false });
      },
    }),
    {
      name: 'nazrah-auth-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the biometricEnabled flag; everything else re-hydrates from Supabase
      partialize: (s) => ({
        biometricEnabled: s.biometricEnabled,
        profile: s.profile,
      }),
    }
  )
);
