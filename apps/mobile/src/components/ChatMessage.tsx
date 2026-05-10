import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography, textAlign, flexDir } from '@/theme/tokens';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export function ChatMessage({ role, content, streaming = false }: Props) {
  const isUser = role === 'user';

  return (
    <View
      style={[
        styles.row,
        { flexDirection: flexDir(), justifyContent: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          { maxWidth: '80%' },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? colors.white : colors.ink900, textAlign: textAlign() },
          ]}
        >
          {content}
          {streaming && <Text style={{ opacity: 0.7 }}>▊</Text>}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 4, paddingHorizontal: 16, gap: 8, alignItems: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: { color: colors.white, fontWeight: '700', ...typography.sm },
  bubble: { borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: colors.stone, borderBottomLeftRadius: 4 },
  text: { ...typography.base, lineHeight: 22 },
});
