'use client';

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { 
  sendGlobalMessageAction, 
  getRecentGlobalMessagesAction,
  type GlobalChatActionState 
} from '@/app/actions/global-chat';
import { GlobalChatRealtimeClient } from '@/lib/realtime/globalChatClient';
import type { GlobalChatMessage } from '@/modules/global-chat/types';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/components/ui/card';
import { cn } from '@/components/lib/utils';
import { useSyntheticMessages } from '@/hooks/useSyntheticMessages';

const initialState: GlobalChatActionState = {
  status: 'idle',
};

export function GlobalChatWidget() {
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [state, formAction, isPending] = useActionState(sendGlobalMessageAction, initialState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const addMessage = useCallback((message: GlobalChatMessage) => {
    setMessages((prev) => {
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  useSyntheticMessages(addMessage);

  useEffect(() => {
    getRecentGlobalMessagesAction().then((initialMessages) => {
      setMessages(initialMessages);
    });

    const client = new GlobalChatRealtimeClient();
    const unsubscribe = client.subscribe(addMessage);

    return () => {
      unsubscribe();
    };
  }, [addMessage]);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      // Optimistic update (or rather, action result update)
      // If realtime is slow, this ensures the user sees their own message immediately
      if (state.sentMessage) {
        setMessages((prev) => {
          if (prev.some(m => m.id === state.sentMessage!.id)) {
            return prev;
          }
          return [...prev, state.sentMessage!];
        });
      }
    }
  }, [state]);

  return (
    <Card className={cn(
      "w-full flex flex-col bg-slate-900 border-slate-800 text-slate-100 transition-all duration-300",
      isMinimized ? "h-auto" : "h-full lg:h-[400px]"
    )}>
      <CardHeader 
        className="py-3 px-4 border-b border-slate-800 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Chat ao Vivo
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[44px] min-w-[44px] text-slate-400 hover:text-white p-0">
          {isMinimized ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700"
          >
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-xs mt-10">
                Seja o primeiro a falar!
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id || Math.random().toString()} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-400">{msg.userName}</span>
                  <span className="text-[10px] text-slate-600">
                    {(() => {
                      try {
                        const date = new Date(msg.createdAt);
                        return isNaN(date.getTime()) 
                          ? '' 
                          : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch {
                        return '';
                      }
                    })()}
                  </span>
                </div>
                <p className="text-sm text-slate-200 break-words">{msg.body}</p>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900/50">
            <form ref={formRef} action={formAction} className="flex gap-2">
              <Input
                name="body"
                placeholder="Digite sua mensagem..."
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 h-10 text-sm"
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 text-sm"
              >
                {isPending ? '...' : 'Enviar'}
              </Button>
            </form>
            {state.status === 'error' && (
              <p className="text-red-500 text-xs mt-1">{state.message}</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
