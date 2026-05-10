import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import type { Locale } from '@/lib/i18n';
import { i18n } from '@/lib/i18n';

interface UiState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      locale: 'en',

      setLocale: (locale) => {
        const isRTL = locale === 'ar';
        i18n.locale = locale;

        // Apply RTL layout — requires app restart to take full effect
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);
          // The profile screen shows a restart nudge; actual reload handled there
        }

        set({ locale });
      },
    }),
    {
      name: 'nazrah-ui',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
