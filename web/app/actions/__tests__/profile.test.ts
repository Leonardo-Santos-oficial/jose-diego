import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateProfileAction } from '@/app/actions/profile';
import type { ProfileActionState } from '@/app/actions/profile-state';

const getCurrentSessionMock = vi.fn();
const upsertMock = vi.fn();
const updateUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: () => getCurrentSessionMock(),
}));

vi.mock('@/lib/supabase/serverClient', () => ({
  getSupabaseServerClient: async () => ({
    from: fromMock,
    auth: {
      updateUser: updateUserMock,
    },
  }),
}));

function buildFormData(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}

beforeEach(() => {
  getCurrentSessionMock.mockReset();
  upsertMock.mockReset();
  updateUserMock.mockReset();
  fromMock.mockReset();
  fromMock.mockImplementation(() => ({ upsert: upsertMock }));
});

describe('updateProfileAction', () => {
  it('rejects when user is not authenticated', async () => {
    getCurrentSessionMock.mockResolvedValueOnce(null);

    const result = await updateProfileAction(
      { status: 'idle' },
      buildFormData({
        displayName: 'Demo',
        pixKey: 'demo@pix',
      })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Faça login para atualizar seu perfil.',
    } satisfies ProfileActionState);
  });

  it('validates input length and returns first issue', async () => {
    getCurrentSessionMock.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const result = await updateProfileAction(
      { status: 'idle' },
      buildFormData({
        displayName: 'x'.repeat(80),
        pixKey: 'ok',
      })
    );

    expect(result.status).toBe('error');
    expect(result.message).toContain('60');
  });

  it('propagates supabase errors from upsert', async () => {
    getCurrentSessionMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    upsertMock.mockResolvedValueOnce({ error: { message: 'falha upsert' } });

    const result = await updateProfileAction(
      { status: 'idle' },
      buildFormData({
        displayName: 'Demo',
        pixKey: 'pix',
      })
    );

    expect(result).toEqual({ status: 'error', message: 'falha upsert' });
  });

  it('confirms success when both operations finish without error', async () => {
    getCurrentSessionMock.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'u@example.com' },
    });
    upsertMock.mockResolvedValueOnce({ error: null });
    updateUserMock.mockResolvedValueOnce({ error: null });

    const result = await updateProfileAction(
      { status: 'idle' },
      buildFormData({
        displayName: 'Demo',
        pixKey: 'pix',
      })
    );

    expect(upsertMock).toHaveBeenCalledWith({
      user_id: 'user-1',
      display_name: 'Demo',
      pix_key: 'pix',
    });
    expect(updateUserMock).toHaveBeenCalledWith({
      data: { display_name: 'Demo' },
    });
    expect(result).toEqual({
      status: 'success',
      message: 'Perfil atualizado com sucesso.',
    });
  });
});
