import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { colors, radius, typography } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: { bg: colors.navy, text: colors.white, border: colors.navy },
  secondary: { bg: colors.white, text: colors.navy, border: colors.cloud },
  ghost: { bg: 'transparent', text: colors.navy, border: 'transparent' },
  danger: { bg: colors.red, text: colors.white, border: colors.red },
};

const sizeStyles = {
  sm: { paddingVertical: 6, paddingHorizontal: 14, ...typography.sm },
  md: { paddingVertical: 12, paddingHorizontal: 20, ...typography.base },
  lg: { paddingVertical: 16, paddingHorizontal: 28, ...typography.md },
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
          paddingVertical: ss.paddingVertical,
          paddingHorizontal: ss.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            { color: vs.text, fontSize: ss.fontSize, lineHeight: ss.lineHeight },
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: 8,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
