import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendChatMessageAction,
  sendAdminMessageAction,
  closeChatThreadAction,
  updateChatThreadMetadataAction,
} from '@/app/actions/chat';
import { chatActionInitialState } from '@/app/actions/chat-state';

const { executeForUserMock, executeForAdminMock, chatServiceMock } = vi.hoisted(() => {
  return {
    executeForUserMock: vi.fn(),
    executeForAdminMock: vi.fn(),
    chatServiceMock: {
      updateThreadStatus: vi.fn(),
      updateThreadMetadata: vi.fn(),
      assignThread: vi.fn(),
    },
  };
});

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock('@/lib/auth/roles', () => ({
  isAdminSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/modules/chat/services/chatService', () => ({
  ChatService: vi.fn().mockImplementation(() => chatServiceMock),
}));

vi.mock('@/modules/chat/commands/SendChatMessageCommand', () => ({
  SendChatMessageCommand: vi.fn().mockImplementation(() => ({
    executeForUser: executeForUserMock,
    executeForAdmin: executeForAdminMock,
  })),
}));

const { getCurrentSession } = await import('@/lib/auth/session');
const { isAdminSession } = await import('@/lib/auth/roles');
const { revalidatePath } = await import('next/cache');

function buildFormData(entries: Record<string, string>): FormData {
  const form = new FormData();
  Object.entries(entries).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe('chat actions', () => {
  beforeEach(() => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(isAdminSession).mockReturnValue(false);
    executeForUserMock.mockReset();
    executeForAdminMock.mockReset();
    chatServiceMock.updateThreadStatus.mockReset();
    chatServiceMock.updateThreadMetadata.mockReset();
    chatServiceMock.assignThread.mockReset();
    vi.mocked(revalidatePath).mockReset();
  });

  describe('sendChatMessageAction', () => {
    it('rejects anonymous users', async () => {
      vi.mocked(getCurrentSession).mockResolvedValue(null);

      const result = await sendChatMessageAction(chatActionInitialState, new FormData());

      expect(result).toEqual({
        status: 'error',
        message: 'Faça login para usar o chat.',
      });
      expect(executeForUserMock).not.toHaveBeenCalled();
    });

    it('validates empty body', async () => {
      const result = await sendChatMessageAction(
        chatActionInitialState,
        buildFormData({ body: '   ' })
      );

      expect(result).toEqual({ status: 'error', message: 'Digite uma mensagem.' });
      expect(executeForUserMock).not.toHaveBeenCalled();
    });

    it('delegates to command on success', async () => {
      executeForUserMock.mockResolvedValue({
        thread: { id: 'thread-1' },
        message: { id: 1 } as any,
      });

      const result = await sendChatMessageAction(
        chatActionInitialState,
        buildFormData({ body: 'Preciso de ajuda' })
      );

      expect(executeForUserMock).toHaveBeenCalledWith({
        userId: 'user-1',
        body: 'Preciso de ajuda',
      });
      expect(result.status).toBe('success');
      expect(result.threadId).toBe('thread-1');
      expect(result.lastMessage?.id).toBe(1);
    });
  });

  describe('sendAdminMessageAction', () => {
    it('denies when requester is not admin', async () => {
      const result = await sendAdminMessageAction(
        chatActionInitialState,
        buildFormData({ threadId: 't-1', body: 'Oi' })
      );

      expect(result).toEqual({ status: 'error', message: 'Acesso não autorizado.' });
      expect(executeForAdminMock).not.toHaveBeenCalled();
    });

    it('enqueues reply, updates metadata and revalidates on success', async () => {
      vi.mocked(isAdminSession).mockReturnValue(true);
      executeForAdminMock.mockResolvedValue({
        thread: { id: 'thread-2' },
        message: { id: 2 } as any,
      });
      vi.mocked(getCurrentSession).mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@test.dev' },
      } as any);

      const result = await sendAdminMessageAction(
        chatActionInitialState,
        buildFormData({ threadId: 'thread-2', body: 'Resposta' })
      );

      expect(executeForAdminMock).toHaveBeenCalledWith({
        threadId: 'thread-2',
        body: 'Resposta',
      });
      expect(chatServiceMock.assignThread).toHaveBeenCalledWith('thread-2', 'admin-1');
      expect(chatServiceMock.updateThreadMetadata).toHaveBeenCalledWith('thread-2', {
        lastAgentName: 'admin@test.dev',
      });
      expect(result.status).toBe('success');
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin');
    });
  });

  describe('closeChatThreadAction', () => {
    it('blocks non-admin access', async () => {
      const result = await closeChatThreadAction(buildFormData({ threadId: 'thread-3' }));

      expect(result).toEqual({ ok: false });
      expect(chatServiceMock.updateThreadStatus).not.toHaveBeenCalled();
    });

    it('updates thread using service role and revalidates', async () => {
      vi.mocked(isAdminSession).mockReturnValue(true);
      vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'admin-2' } } as any);

      const result = await closeChatThreadAction(buildFormData({ threadId: 'thread-3' }));

      expect(chatServiceMock.updateThreadStatus).toHaveBeenCalledWith(
        'thread-3',
        'closed',
        {
          closedBy: 'admin-2',
        }
      );
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ ok: true });
    });
  });

  describe('updateChatThreadMetadataAction', () => {
    it('updates notes and assignment when admin submits form', async () => {
      vi.mocked(isAdminSession).mockReturnValue(true);
      vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: 'admin-5' } } as any);

      const result = await updateChatThreadMetadataAction(
        buildFormData({
          threadId: 'thread-9',
          notes: '  follow-up  ',
          assignToSelf: 'on',
        })
      );

      expect(chatServiceMock.updateThreadMetadata).toHaveBeenCalledWith('thread-9', {
        notes: 'follow-up',
      });
      expect(chatServiceMock.assignThread).toHaveBeenCalledWith('thread-9', 'admin-5');
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/admin');
      expect(result).toEqual({ ok: true });
    });
  });
});
