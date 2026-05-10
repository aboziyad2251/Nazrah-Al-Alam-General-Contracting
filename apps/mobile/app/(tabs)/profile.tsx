import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';

export default function Profile() {
  const router = useRouter();
  const { session, signOut } = useAuthStore();
  const { locale, setLocale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  const handleToggleLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
    i18n.locale = newLocale;
    const isRtl = newLocale === 'ar';
    if (I18nManager.isRTL !== isRtl) {
      I18nManager.allowRTL(isRtl);
      I18nManager.forceRTL(isRtl);
      // RTL change takes effect on next app restart
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/phone');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.profile')}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="person-circle" size={64} color={colors.navy} />
          <Text style={styles.phone}>{session?.user?.phone}</Text>
        </View>

        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingRow} onPress={handleToggleLocale}>
            <Ionicons name="language" size={24} color={colors.navy} />
            <Text style={styles.settingText}>
              {t('profile.language')} ({locale === 'en' ? 'English' : 'العربية'})
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.ink400} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="red" />
          <Text style={styles.logoutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
  },
  title: { ...typography.xl, fontWeight: 'bold', color: colors.navy },
  content: { padding: 16 },
  infoCard: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  phone: { ...typography.lg, fontWeight: 'bold', color: colors.navy, marginTop: 12 },
  settingsGroup: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
  },
  settingText: { flex: 1, ...typography.md, color: colors.navy, marginLeft: 12 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: { ...typography.md, color: 'red', fontWeight: 'bold', marginLeft: 8 },
});
