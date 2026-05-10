import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography, textAlign } from '@/theme/tokens';
import type { EquipmentRow } from '@/lib/supabase';

interface Props {
  item: EquipmentRow;
  onAdd: (item: EquipmentRow) => void;
  addLabel: string;
  perDayLabel: string;
}

export function EquipmentCard({ item, onAdd, addLabel, perDayLabel }: Props) {
  const available = item.status === 'available';

  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="construct-outline" size={32} color={colors.cloud} />
          </View>
        )}
        {!available && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Rented</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.brand, { textAlign: textAlign() }]} numberOfLines={1}>
          {item.brand}
        </Text>
        <Text style={[styles.name, { textAlign: textAlign() }]} numberOfLines={2}>
          {item.model_name}
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.rate}>SAR {item.daily_rate_sar.toLocaleString()}</Text>
            <Text style={styles.perDay}>{perDayLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onAdd(item)}
            disabled={!available}
            style={[styles.addBtn, !available && styles.addBtnDisabled]}
          >
            <Ionicons name="add" size={18} color={available ? colors.white : colors.ink400} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stone,
    overflow: 'hidden',
    ...shadow.sm,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: colors.stone,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: colors.white,
    fontWeight: '700',
    ...typography.sm,
  },
  body: { padding: 10 },
  brand: { ...typography.xs, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.ink900,
    marginTop: 2,
    marginBottom: 8,
  },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  rate: { ...typography.base, fontWeight: '700', color: colors.navy },
  perDay: { ...typography.xs, color: colors.ink500 },
  addBtn: { backgroundColor: colors.navy, borderRadius: radius.sm, padding: 7 },
  addBtnDisabled: { backgroundColor: colors.stone },
});
