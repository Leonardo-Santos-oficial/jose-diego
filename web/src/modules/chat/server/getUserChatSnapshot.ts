import { z } from 'zod';
import { ChatService } from '@/modules/chat/services/chatService';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

export type UserChatSnapshot = {
  thread: ChatThread;
  messages: ChatMessage[];
};

const chatService = new ChatService();

const serviceRoleChatService = new ChatService(async () => getSupabaseServiceRoleClient());

export async function getUserChatSnapshot(userId: string): Promise<UserChatSnapshot> {
  const parsedUserId = z.string().uuid().safeParse(userId);
  if (!parsedUserId.success) {
    throw new Error('ID do usuário inválido.');
  }

  try {
    const thread = await chatService.getOrCreateThread(parsedUserId.data);
    const messages = await chatService.listMessages(thread.id);
    return { thread, messages };
  } catch (error) {
    // Após o purge, pode ocorrer falha para recriar o thread via sessão do usuário (RLS/políticas).
    // Faz fallback via service role, mas ainda retorna apenas dados desse usuário.
    console.error('[chat] falha ao buscar snapshot via sessão, tentando service role', error);

    const thread = await serviceRoleChatService.getOrCreateThread(parsedUserId.data);
    const messages = await serviceRoleChatService.listMessages(thread.id);
    return { thread, messages };
  }
}
