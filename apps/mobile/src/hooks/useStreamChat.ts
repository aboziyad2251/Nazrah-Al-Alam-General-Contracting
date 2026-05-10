import { useState, useCallback, useRef } from 'react';
import { streamGateway } from '@/lib/sseStream';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useStreamChat(conversationId?: number) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState('');
  const abortRef = useRef(false);

  const { session } = useAuthStore();
  const { locale } = useUiStore();

  const send = useCallback(
    async (message: string) => {
      if (!session || streaming) return;

      // Append user turn immediately
      const userTurn: ChatTurn = { id: Date.now().toString(), role: 'user', content: message };
      setTurns((prev) => [...prev, userTurn]);
      setStreaming(true);
      setStreamBuf('');
      abortRef.current = false;

      // Persist user message to Supabase (if conversation is open)
      if (conversationId) {
        supabase
          .from('ai_messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: message,
          })
          .then(() => {});
      }

      const history = turns.slice(-10).map((t) => ({ role: t.role, content: t.content }));

      try {
        const gen = streamGateway(process.env.EXPO_PUBLIC_SUPABASE_URL!, session.access_token, {
          task: 'chat',
          payload: { message, history },
          user_id: session.user.id,
          locale,
          conversation_id: conversationId,
        });

        let fullText = '';
        for await (const ev of gen) {
          if (abortRef.current) break;
          if (ev.type === 'delta') {
            fullText += ev.text;
            setStreamBuf(fullText);
          }
          if (ev.type === 'done' || ev.type === 'error') break;
        }

        if (fullText) {
          const assistantTurn: ChatTurn = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullText,
          };
          setTurns((prev) => [...prev, assistantTurn]);
        }
      } catch (err) {
        console.error('[useStreamChat]', err);
      } finally {
        setStreaming(false);
        setStreamBuf('');
      }
    },
    [session, streaming, turns, conversationId, locale]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { turns, streaming, streamBuf, send, abort };
}
