import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  return <View style={[styles.card, elevated && shadow.md, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stone,
    padding: 16,
    ...shadow.sm,
  },
});
