'use server';

import { z } from 'zod';
import { getCurrentSession } from '@/lib/auth/session';
import { SupabaseGlobalChatRepository } from '@/modules/global-chat/repositories/supabaseGlobalChatRepository';
import { SupabaseGlobalChatPublisher } from '@/modules/global-chat/publishers/supabaseGlobalChatPublisher';
import { SendGlobalMessageCommand } from '@/modules/global-chat/commands/sendGlobalMessageCommand';
import { rateLimiter } from '@/lib/rate-limit';
import { htmlSanitizer } from '@/lib/security/htmlSanitizer';

const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Digite uma mensagem.')
    .max(500, 'Mensagem deve ter no máximo 500 caracteres.')
    .transform((val) => htmlSanitizer.sanitize(val)),
});

import type { GlobalChatMessage } from '@/modules/global-chat/types';

export type GlobalChatActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  sentMessage?: GlobalChatMessage;
};

export async function getRecentGlobalMessagesAction(): Promise<GlobalChatMessage[]> {
  const repository = new SupabaseGlobalChatRepository();
  try {
    // Fetch last 50 messages
    const messages = await repository.fetchRecentMessages(50);
    // Repository returns newest first (descending), but chat UI usually wants oldest first (ascending)
    // so we reverse it here.
    return messages.reverse();
  } catch (error) {
    console.error('Failed to fetch recent messages:', error);
    return [];
  }
}

export async function sendGlobalMessageAction(
  _prevState: GlobalChatActionState,
  formData: FormData
): Promise<GlobalChatActionState> {
  const session = await getCurrentSession();
  if (!session || !session.id) {
    return { status: 'error', message: 'Faça login para participar do chat.' };
  }

  // Rate Limit: 5 messages per 10 seconds per user
  const isAllowed = rateLimiter.check(`chat:${session.id}`, 5, 10 * 1000);
  if (!isAllowed) {
    return { status: 'error', message: 'Você está enviando mensagens muito rápido. Aguarde um pouco.' };
  }

  const parsed = messageSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message };
  }

  // Clean Code: Dependency Injection (Manual here, but follows the principle)
  const repository = new SupabaseGlobalChatRepository();
  const publisher = new SupabaseGlobalChatPublisher();
  const command = new SendGlobalMessageCommand(repository, publisher);

  try {
    // We use the user's email or name as display name.
    // Ideally this should come from a profile table, but session might have it.
    // Let's assume session.email for now or "Jogador".
    const userName = session.email?.split('@')[0] || 'Jogador';

    const sentMessage = await command.execute({
      userId: session.id,
      userName,
      body: parsed.data.body,
    });

    return { status: 'success', sentMessage };
  } catch (error) {
    console.error('Failed to send global message:', error);
    return { status: 'error', message: 'Erro ao enviar mensagem.' };
  }
}
