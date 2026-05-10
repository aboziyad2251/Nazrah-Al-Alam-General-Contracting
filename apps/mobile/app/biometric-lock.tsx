import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/theme/tokens';
import { i18n } from '@/lib/i18n';

export default function BiometricLockScreen() {
  const { unlockWithBiometric, signOut, profile } = useAuthStore();
  const { locale } = useUiStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');

  const t = (k: string) => i18n.t(k, { locale });

  const tryBiometric = async () => {
    setError('');
    const ok = await unlockWithBiometric();
    if (ok) {
      router.replace('/(tabs)');
    } else {
      setError('Biometric authentication failed. Try again or sign in.');
    }
  };

  // Auto-prompt on mount
  useEffect(() => {
    tryBiometric();
  }, []);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.logoRow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.appName}>Nazrah Al Alam</Text>
      </View>

      <View style={styles.mid}>
        <Text style={styles.greeting}>{t('auth.biometricTitle')}</Text>
        <Text style={styles.name}>{profile?.full_name ?? profile?.phone ?? ''}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={tryBiometric} style={styles.bioBtn}>
          <Ionicons name="finger-print" size={48} color={colors.navy} />
          <Text style={styles.bioBtnText}>{t('auth.biometricPrompt')}</Text>
        </TouchableOpacity>

        <Button variant="ghost" onPress={signOut} style={{ marginTop: 24 }}>
          {t('profile.signOut')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  logoRow: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: colors.white, fontSize: 28, fontWeight: '800' },
  appName: { ...typography.xl, fontWeight: '700', color: colors.navy },
  mid: { alignItems: 'center', gap: 8 },
  greeting: { ...typography.lg, fontWeight: '600', color: colors.ink900 },
  name: { ...typography.base, color: colors.ink500 },
  error: { ...typography.sm, color: colors.red, textAlign: 'center', marginTop: 8 },
  actions: { alignItems: 'center' },
  bioBtn: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.cloud,
    width: '100%',
  },
  bioBtnText: { ...typography.base, color: colors.navy, fontWeight: '600' },
});
