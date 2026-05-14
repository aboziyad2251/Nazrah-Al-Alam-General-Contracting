import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Skeleton } from '@/components/ui';
import { Send, Bot, User, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

export default function AssistantPage() {
  const { user } = useAuthStore();
  const { locale } = useUIStore();
  const qc = useQueryClient();

  const [input, setInput] = useState('');
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState(''); // accumulates in-progress reply
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['conversations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('id,title,created_at')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data ?? []) as Conversation[];
    },
  });

  const { data: messages, isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ['messages', activeConvId],
    enabled: !!activeConvId,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_messages')
        .select('id,role,content,created_at')
        .eq('conversation_id', activeConvId!)
        .order('created_at');
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const newConversation = useMutation({
    mutationFn: async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({
          profile_id: user!.id,
          title: 'New Conversation',
          model_used: 'claude-sonnet-4-6',
        })
        .select('id')
        .single();
      return data!.id as number;
    },
    onSuccess: (id) => {
      setActiveConvId(id);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || streaming) return;
    const text = input.trim();
    setInput('');
    setStreaming(true);
    setStreamText('');

    // 1. Save user message to DB
    await supabase.from('ai_messages').insert({
      conversation_id: activeConvId,
      role: 'user',
      content: text,
    });
    qc.invalidateQueries({ queryKey: ['messages', activeConvId] });

    // 2. Build history from current messages for context
    const history = (messages ?? []).slice(-10).map((m) => ({ role: m.role, content: m.content }));

    // 3. Call AI gateway (streaming)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'chat',
          payload: { message: text, history },
          user_id: session.user.id,
          locale,
          conversation_id: activeConvId,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Gateway ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(raw);
          } catch {
            continue;
          }

          if (ev.type === 'delta' && ev.text) {
            setStreamText((prev) => prev + (ev.text as string));
          }

          if (ev.type === 'done' || ev.type === 'error') break;
        }
      }
    } catch (e) {
      console.error('[assistant] stream error:', e);
    }

    // 4. Gateway saved the assistant message — refresh query to show it
    await qc.invalidateQueries({ queryKey: ['messages', activeConvId] });
    setStreamText('');
    setStreaming(false);
  };

  const isAr = locale === 'ar';

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Conversation list */}
      <div className="flex w-64 shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() => newConversation.mutate()}
          className="flex w-full items-center gap-2 rounded-xl bg-[#0E1F3A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0A1628]"
        >
          <Plus size={14} />
          {isAr ? 'محادثة جديدة' : 'New Chat'}
        </button>

        <div className="flex-1 space-y-1 overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-3">
          {conversations?.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={cn(
                'w-full truncate rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                activeConvId === c.id
                  ? 'bg-[#0E1F3A] text-white'
                  : 'text-[#5A6573] hover:bg-[#D9DCE0]'
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E8EAED] p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B339]">
            <Bot size={16} className="text-[#0E1F3A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1117]">
              {isAr ? 'مساعد نظرة' : 'Nazrah AI Assistant'}
            </p>
            <p className="text-xs text-[#5A6573]">
              {isAr ? 'مستشار المعدات · متاح دائماً' : 'Equipment advisor · Always online'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!activeConvId && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D9DCE0]">
                <Bot size={32} className="text-[#5A6573]" />
              </div>
              <p className="font-semibold text-[#0F1117]">
                {isAr ? 'ابدأ محادثة جديدة' : 'Start a new conversation'}
              </p>
              <p className="mt-1 max-w-xs text-sm text-[#5A6573]">
                {isAr
                  ? 'اسأل عن المعدات أو تحليل الموقع أو اقتراح المشاريع.'
                  : 'Ask about equipment selection, project scoping, or site analysis.'}
              </p>
              <button
                type="button"
                onClick={() => newConversation.mutate()}
                className="mt-4 rounded-xl bg-[#0E1F3A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0A1628]"
              >
                {isAr ? 'ابدأ الآن' : 'Start Chatting'}
              </button>
            </div>
          )}

          {msgsLoading && <Skeleton className="h-40" />}

          {messages?.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {/* Streaming bubble */}
          {streaming && (
            <div className="flex flex-row gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8B339]">
                <Bot size={14} className="text-[#0E1F3A]" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-[#D9DCE0] px-4 py-3">
                {streamText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F1117]">
                    {streamText}
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#0E1F3A] align-middle" />
                  </p>
                ) : (
                  <Loader2 size={16} className="animate-spin text-[#5A6573]" />
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {activeConvId && (
          <div className="flex gap-3 border-t border-[#E8EAED] p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={
                isAr ? 'اكتب سؤالك...' : 'Ask about equipment, project scope, site analysis…'
              }
              className="flex-1 rounded-xl border border-[#E8EAED] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
              disabled={streaming}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E1F3A] text-white transition-colors hover:bg-[#0A1628] disabled:opacity-40"
            >
              {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
          isUser ? 'bg-[#0E1F3A]' : 'bg-[#E8B339]'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} className="text-[#0E1F3A]" />}
      </div>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'rounded-tr-sm bg-[#0E1F3A] text-white'
            : 'rounded-tl-sm bg-[#D9DCE0] text-[#0F1117]'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        <p
          className={cn('mt-1 text-[10px]', isUser ? 'text-right text-white/50' : 'text-[#5A6573]')}
        >
          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
