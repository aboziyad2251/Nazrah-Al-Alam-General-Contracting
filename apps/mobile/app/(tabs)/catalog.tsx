import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/theme/tokens';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';

type Equipment = {
  id: string;
  model_name: string;
  brand: string;
  category: string;
  daily_rate_sar: number;
  status: string;
  image_url: string | null;
};

export default function Catalog() {
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });

  const {
    data: equipment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*').order('category');
      if (error) throw error;
      return data as Equipment[];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours caching for offline
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.catalog')}</Text>
      </View>
      <FlatList
        data={equipment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.itemName}>{item.model_name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cloud,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
  },
  title: { ...typography.xl, fontWeight: 'bold', color: colors.navy },
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: { width: '100%', height: 150 },
  imagePlaceholder: { width: '100%', height: 150, backgroundColor: colors.stone },
  cardBody: { padding: 16 },
  itemName: { ...typography.md, fontWeight: 'bold', color: colors.navy, marginBottom: 4 },
  itemCategory: { ...typography.sm, color: colors.ink400 },
  errorText: { ...typography.md, color: 'red' },
});
