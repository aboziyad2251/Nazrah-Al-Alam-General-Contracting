import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme/tokens';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';

export default function Notifications() {
  const router = useRouter();
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  // Dummy notifications
  const notifications = [
    {
      id: '1',
      title: 'Quote Approved',
      body: 'Your quote for the excavator has been approved.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'Equipment Delivered',
      body: 'The bulldozer has arrived at your site.',
      time: '1 day ago',
      read: true,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unreadCard]}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="notifications"
                size={24}
                color={item.read ? colors.ink400 : colors.gold}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.body}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.ink400} />
            <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
  },
  backButton: { padding: 4 },
  title: { ...typography.lg, fontWeight: 'bold', color: colors.navy },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  unreadCard: { backgroundColor: '#F0F8FF', borderColor: colors.gold, borderWidth: 1 },
  iconContainer: { marginRight: 16, justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.md, fontWeight: 'bold', color: colors.navy, marginBottom: 4 },
  cardText: { ...typography.sm, color: colors.navy, marginBottom: 8 },
  timeText: { ...typography.xs, color: colors.ink400 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { ...typography.md, color: colors.ink400, marginTop: 16 },
});
