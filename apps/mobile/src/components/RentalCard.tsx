import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, flexDir, textAlign } from '@/theme/tokens';
import type { BookingRow } from '@/lib/supabase';

interface Props {
  booking: BookingRow;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RentalCard({ booking: b }: Props) {
  const equipment = b.booking_assignments ?? [];

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { flexDirection: flexDir() }]}>
        <View style={styles.info}>
          <Text style={[styles.project, { textAlign: textAlign() }]}>
            {b.quotes?.project_name ?? `Booking #${b.id}`}
          </Text>
          {b.delivery_address && (
            <View style={[styles.row, { flexDirection: flexDir() }]}>
              <Ionicons name="location-outline" size={12} color={colors.ink500} />
              <Text style={styles.meta}>{b.delivery_address}</Text>
            </View>
          )}
        </View>
        <StatusBadge status={b.status} />
      </View>

      {equipment.length > 0 && (
        <View style={[styles.chips, { flexDirection: flexDir() }]}>
          {equipment.map((a, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>{a.equipment?.model_name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.dates, { flexDirection: flexDir() }]}>
        {b.delivery_date && (
          <View style={[styles.row, { flexDirection: flexDir() }]}>
            <Ionicons name="calendar-outline" size={12} color={colors.ink500} />
            <Text style={styles.meta}>{fmt(b.delivery_date)}</Text>
          </View>
        )}
        {b.return_date && (
          <View style={[styles.row, { flexDirection: flexDir() }]}>
            <Ionicons name="flag-outline" size={12} color={colors.ink500} />
            <Text style={styles.meta}>{fmt(b.return_date)}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  info: { flex: 1 },
  project: { ...typography.base, fontWeight: '600', color: colors.ink900 },
  row: { alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { ...typography.sm, color: colors.ink500 },
  chips: { flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    backgroundColor: colors.stone,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { ...typography.xs, color: colors.ink700, fontWeight: '500' },
  dates: { gap: 8, flexWrap: 'wrap' },
});
