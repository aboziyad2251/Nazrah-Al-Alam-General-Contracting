import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';
import { colors, typography, radius, textAlign } from '@/theme/tokens';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCd, setResendCd] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enableBiometric } = useAuthStore();
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone ?? '',
      token: otp,
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Verification failed', error.message);
      return;
    }

    // Offer biometric setup after first successful sign-in
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (compatible && enrolled) {
      Alert.alert(t('auth.biometricTitle'), t('auth.biometricMsg'), [
        {
          text: t('auth.skipBiometric'),
          style: 'cancel',
          onPress: () => router.replace('/(tabs)'),
        },
        {
          text: t('auth.enableBiometric'),
          onPress: async () => {
            await enableBiometric();
            router.replace('/(tabs)');
          },
        },
      ]);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleResend = async () => {
    await supabase.auth.signInWithOtp({ phone: phone ?? '' });
    setResendCd(60);
    const iv = setInterval(() => {
      setResendCd((c) => {
        if (c <= 1) {
          clearInterval(iv);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>N</Text>
        </View>
        <Text style={[styles.title, { textAlign: textAlign() }]}>{t('auth.otpTitle')}</Text>
        <Text style={[styles.sub, { textAlign: 'center' }]}>
          {t('auth.otpSubtitle')} {phone}
        </Text>
      </View>

      <TextInput
        ref={inputRef}
        style={[styles.otpInput, { textAlign: 'center' }]}
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="• • • • • •"
        placeholderTextColor={colors.ink400}
        autoFocus
      />

      <Button
        onPress={handleVerify}
        loading={loading}
        disabled={otp.length !== 6}
        fullWidth
        size="lg"
      >
        {t('auth.verify')}
      </Button>

      <TouchableOpacity onPress={handleResend} disabled={resendCd > 0} style={styles.resendRow}>
        <Text style={[styles.resend, { color: resendCd > 0 ? colors.ink400 : colors.navy }]}>
          {resendCd > 0 ? `Resend in ${resendCd}s` : t('auth.resend')}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28, gap: 20 },
  header: { alignItems: 'center', gap: 12, marginBottom: 16 },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: { color: colors.white, fontSize: 24, fontWeight: '800' },
  title: { ...typography.xl, fontWeight: '700', color: colors.ink900 },
  sub: { ...typography.base, color: colors.ink500, lineHeight: 22 },
  otpInput: {
    backgroundColor: colors.stone,
    borderRadius: radius.md,
    paddingVertical: 18,
    letterSpacing: 12,
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink900,
    borderWidth: 1.5,
    borderColor: colors.cloud,
  },
  resendRow: { alignItems: 'center', paddingVertical: 12 },
  resend: { ...typography.base, fontWeight: '600' },
});
