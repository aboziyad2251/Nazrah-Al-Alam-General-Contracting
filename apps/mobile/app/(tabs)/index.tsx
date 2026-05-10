import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme/tokens';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';

export default function Home() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {t('home.greeting')}, {session?.user?.phone || 'User'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bell}>
          <Ionicons name="notifications-outline" size={24} color={colors.navy} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/catalog')}>
          <Ionicons name="construct" size={32} color={colors.gold} />
          <Text style={styles.actionText}>{t('nav.catalog')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/quotes')}>
          <Ionicons name="document-text" size={32} color={colors.gold} />
          <Text style={styles.actionText}>{t('nav.quotes')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/survey')}>
          <Ionicons name="camera" size={32} color={colors.gold} />
          <Text style={styles.actionText}>{t('survey.title')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.activeRentals')}</Text>
        {/* Placeholder for active rentals */}
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('home.noRentals')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/catalog')}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>{t('nav.catalog')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  content: { padding: 16, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { ...typography.xl, fontWeight: 'bold', color: colors.navy },
  bell: { padding: 8, backgroundColor: colors.white, borderRadius: 20 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.navy,
    marginTop: 8,
    textAlign: 'center',
  },
  section: { marginBottom: 24 },
  sectionTitle: { ...typography.lg, fontWeight: 'bold', color: colors.navy, marginBottom: 12 },
  emptyCard: { backgroundColor: colors.white, padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { ...typography.md, color: colors.ink400, marginBottom: 16 },
  primaryButton: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { ...typography.md, color: colors.navy, fontWeight: 'bold' },
});
