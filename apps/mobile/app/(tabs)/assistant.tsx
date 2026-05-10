import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme/tokens';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { i18n } from '@/lib/i18n';
import { streamGateway } from '@/lib/sseStream';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function Assistant() {
  const { locale } = useUiStore();
  const { session } = useAuthStore();
  const t = (k: string) => i18n.t(k, { locale });

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: t('assistant.empty') },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = session?.access_token ?? '';
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const stream = streamGateway(supabaseUrl, token, {
        task: 'chat',
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        locale,
      });

      for await (const event of stream) {
        if (event.type === 'delta') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.text } : m))
          );
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: t('common.error') } : m))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.assistant')}</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View
            style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}
          >
            <Text
              style={[styles.messageText, item.role === 'user' ? styles.userText : styles.botText]}
            >
              {item.content || '…'}
            </Text>
          </View>
        )}
      />
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('assistant.placeholder')}
          placeholderTextColor={colors.ink400}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={isLoading || !input.trim()}
        >
          <Ionicons name="send" size={20} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cloud },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone,
  },
  title: { ...typography.xl, fontWeight: 'bold', color: colors.navy },
  listContent: { padding: 16, gap: 12 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.stone,
  },
  messageText: { ...typography.md },
  userText: { color: colors.white },
  botText: { color: colors.navy },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.stone,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.cloud,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...typography.md,
    color: colors.navy,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
});
