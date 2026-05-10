import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, flexDir } from '@/theme/tokens';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.row, { flexDirection: flexDir() }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons
              name={flexDir() === 'row' ? 'arrow-back' : 'arrow-forward'}
              size={22}
              color={colors.navy}
            />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && <View style={styles.right}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  row: {
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.ink900,
  },
  subtitle: {
    ...typography.sm,
    color: colors.ink500,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
});
