import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';
import { colors, typography, radius, textAlign } from '@/theme/tokens';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  const handleSend = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned.startsWith('+') || cleaned.length < 9) {
      Alert.alert('Invalid phone number', 'Please include country code, e.g. +966 5X XXX XXXX');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.push({ pathname: '/(auth)/otp', params: { phone: cleaned } });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top + 40 }]}
    >
      {/* Logo */}
      <View style={styles.logoBlock}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>N</Text>
        </View>
        <Text style={styles.brand}>Nazrah Al Alam</Text>
        <Text style={[styles.tagline, { textAlign: textAlign() }]}>{t('auth.subtitle')}</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={[styles.label, { textAlign: textAlign() }]}>{t('auth.phoneLabel')}</Text>
        <TextInput
          style={[styles.input, { textAlign: textAlign() }]}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.ink400}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="done"
          onSubmitEditing={handleSend}
        />

        <Button onPress={handleSend} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }}>
          {t('auth.sendOtp')}
        </Button>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={[styles.footerText, { textAlign: 'center' }]}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28 },
  logoBlock: { alignItems: 'center', gap: 12, marginBottom: 48 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: { color: colors.white, fontSize: 32, fontWeight: '800' },
  brand: { ...typography.xl, fontWeight: '800', color: colors.navy },
  tagline: { ...typography.base, color: colors.ink500, marginTop: 4 },
  form: { gap: 12 },
  label: { ...typography.sm, fontWeight: '600', color: colors.ink700 },
  input: {
    backgroundColor: colors.stone,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.base,
    color: colors.ink900,
    borderWidth: 1.5,
    borderColor: colors.cloud,
  },
  footer: { marginTop: 'auto', paddingTop: 24 },
  footerText: { ...typography.xs, color: colors.ink400, lineHeight: 18 },
});
