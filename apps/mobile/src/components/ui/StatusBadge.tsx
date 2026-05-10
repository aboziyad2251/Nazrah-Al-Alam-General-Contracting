import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '@/theme/tokens';

const STATUS: Record<string, { bg: string; text: string }> = {
  available: { bg: colors.greenBg, text: colors.green },
  rented: { bg: colors.blueBg, text: colors.blue },
  maintenance: { bg: colors.amberBg, text: colors.amber },
  draft: { bg: colors.stone, text: colors.ink500 },
  sent: { bg: colors.blueBg, text: colors.blue },
  accepted: { bg: colors.greenBg, text: colors.green },
  rejected: { bg: colors.redBg, text: colors.red },
  pending: { bg: colors.amberBg, text: colors.amber },
  confirmed: { bg: colors.blueBg, text: colors.blue },
  in_progress: { bg: '#F5F3FF', text: '#7C3AED' },
  completed: { bg: colors.greenBg, text: colors.green },
  cancelled: { bg: colors.redBg, text: colors.red },
};

const fallback = { bg: colors.stone, text: colors.ink500 };

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? fallback;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.text }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
