'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { htmlSanitizer } from '@/lib/security/htmlSanitizer';
import { getCurrentSession, getDisplayName } from '@/lib/auth/session';
import { isAdminSession } from '@/lib/auth/roles';
import type { ChatActionState } from '@/app/actions/chat-state';
import { ChatService } from '@/modules/chat/services/chatService';
import { SendChatMessageCommand } from '@/modules/chat/commands/SendChatMessageCommand';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Digite uma mensagem.')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres.')
    .transform((val) => htmlSanitizer.sanitize(val)),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentType: z.enum(['image', 'document']).optional().nullable(),
  attachmentName: z.string().max(255).optional().nullable(),
});

const metadataSchema = z.object({
  threadId: z.string().min(1, 'Thread inválida.'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notas podem ter no máximo 1000 caracteres.')
    .optional(),
  assignToSelf: z.boolean().optional(),
});

const userCommand = new SendChatMessageCommand();
const adminChatService = new ChatService(async () => getSupabaseServiceRoleClient());
const adminCommand = new SendChatMessageCommand({ chatService: adminChatService });

export async function sendChatMessageAction(
  _prevState: ChatActionState,
  formData: FormData
): Promise<ChatActionState> {
  'use server';

  const session = await getCurrentSession();
  const userId = session?.id;
  const userName = getDisplayName(session);

  if (!userId) {
    return { status: 'error', message: 'Faça login para usar o chat.' };
  }

  const parsed = messageSchema.safeParse({ 
    body: formData.get('body') ?? '',
    attachmentUrl: formData.get('attachmentUrl') || null,
    attachmentType: formData.get('attachmentType') || null,
    attachmentName: formData.get('attachmentName') || null,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Mensagem inválida.';
    return { status: 'error', message: firstIssue };
  }

  const sanitizedBody = parsed.data.body.replace(/<[^>]*>?/gm, '');

  try {
    const result = await userCommand.executeForUser({
      userId,
      userName,
      body: sanitizedBody,
      attachmentUrl: parsed.data.attachmentUrl ?? undefined,
      attachmentType: parsed.data.attachmentType ?? undefined,
      attachmentName: parsed.data.attachmentName ?? undefined,
    });

    return {
      status: 'success',
      message: 'Mensagem enviada.',
      threadId: result.thread.id,
      lastMessage: result.message,
    } satisfies ChatActionState;
  } catch (error) {
    console.error('[chat] erro ao enviar mensagem do usuário', error);
    return {
      status: 'error',
      message: 'Não foi possível enviar sua mensagem agora.',
    } satisfies ChatActionState;
  }
}

export async function sendAdminMessageAction(
  _prevState: ChatActionState,
  formData: FormData
): Promise<ChatActionState> {
  'use server';

  const session = await getCurrentSession();

  if (!isAdminSession(session) || !session) {
    return { status: 'error', message: 'Acesso não autorizado.' };
  }

  const adminUser = session;

  const threadId = String(formData.get('threadId') ?? '').trim();

  if (!threadId) {
    return { status: 'error', message: 'Thread inválida.' };
  }

  const parsed = messageSchema.safeParse({ body: formData.get('body') ?? '' });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Mensagem inválida.';
    return { status: 'error', message: firstIssue, threadId };
  }

  // Simple HTML strip to avoid heavy dependencies on server
  const sanitizedBody = parsed.data.body.replace(/<[^>]*>?/gm, '');

  try {
    const result = await adminCommand.executeForAdmin({
      threadId,
      body: sanitizedBody,
    });

    try {
      await Promise.all([
        adminChatService.assignThread(threadId, adminUser.id),
        adminChatService.updateThreadMetadata(threadId, {
          lastAgentName:
            (adminUser.user_metadata?.display_name as string | undefined) ??
            adminUser.email ??
            'Admin',
        }),
      ]);
    } catch (metaError) {
      console.warn('[chat] falha ao atualizar metadados da thread', metaError);
    }

    revalidatePath('/admin');

    return {
      status: 'success',
      message: 'Resposta enviada.',
      threadId: result.thread.id,
      lastMessage: result.message,
    } satisfies ChatActionState;
  } catch (error) {
    console.error('[chat] erro ao enviar mensagem do admin', error);
    return {
      status: 'error',
      message: 'Não foi possível responder agora.',
      threadId,
    } satisfies ChatActionState;
  }
}

export async function closeChatThreadAction(
  formData: FormData
): Promise<{ ok: boolean }> {
  'use server';

  const session = await getCurrentSession();

  if (!isAdminSession(session) || !session) {
    return { ok: false };
  }

  const adminUser = session;

  const threadId = String(formData.get('threadId') ?? '').trim();

  if (!threadId) {
    return { ok: false };
  }

  const notes = formData.get('notes');

  try {
    const operations: Promise<unknown>[] = [
      adminChatService.updateThreadStatus(threadId, 'closed', {
        closedBy: adminUser.id,
      }),
    ];

    if (typeof notes === 'string' && notes.trim().length > 0) {
      operations.push(
        adminChatService.updateThreadMetadata(threadId, { notes: notes.trim() })
      );
    }

    await Promise.all(operations);
    revalidatePath('/admin');
    return { ok: true };
  } catch (error) {
    console.error('[chat] erro ao fechar thread', error);
    return { ok: false };
  }
}

export async function updateChatThreadMetadataAction(formData: FormData) {
  'use server';

  const session = await getCurrentSession();

  if (!isAdminSession(session) || !session) {
    return { ok: false, message: 'Acesso não autorizado.' } as const;
  }

  const adminUser = session;

  const raw = {
    threadId: formData.get('threadId') ?? '',
    notes: formData.get('notes') ?? undefined,
    assignToSelf: formData.get('assignToSelf') === 'on',
  };

  const parsed = metadataSchema.safeParse({
    threadId: typeof raw.threadId === 'string' ? raw.threadId : '',
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    assignToSelf: raw.assignToSelf,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
    } as const;
  }

  const operations: Promise<unknown>[] = [];

  if (parsed.data.notes !== undefined) {
    const trimmedNotes = parsed.data.notes.trim();
    operations.push(
      adminChatService.updateThreadMetadata(parsed.data.threadId, {
        notes: trimmedNotes.length > 0 ? trimmedNotes : null,
      })
    );
  }

  if (parsed.data.assignToSelf) {
    operations.push(adminChatService.assignThread(parsed.data.threadId, adminUser.id));
  }

  try {
    if (operations.length > 0) {
      await Promise.all(operations);
      revalidatePath('/admin');
    }
    return { ok: true } as const;
  } catch (error) {
    console.error('[chat] erro ao atualizar metadados', error);
    return { ok: false, message: 'Não foi possível atualizar metadados.' } as const;
  }
}
