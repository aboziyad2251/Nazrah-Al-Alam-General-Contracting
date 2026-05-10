import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { queryClient, persister } from '@/lib/queryClient';
import { i18n } from '@/lib/i18n';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const { session, initialized, biometricLocked, initialize } = useAuthStore();
  const { locale } = useUiStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    SplashScreen.hideAsync();
    i18n.locale = locale;

    const inAuth = segments[0] === '(auth)';
    const inBio = segments[0] === 'biometric-lock';

    if (biometricLocked) {
      router.replace('/biometric-lock');
      return;
    }
    if (!session && !inAuth) {
      router.replace('/(auth)/phone');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, biometricLocked]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="biometric-lock" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen
        name="survey"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <StatusBar style="dark" />
          <RootNavigator />
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
