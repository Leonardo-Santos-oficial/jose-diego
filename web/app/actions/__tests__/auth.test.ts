import { describe, it, expect, vi, beforeEach } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { signInAction, signOutAction, signUpAction } from '@/app/actions/auth';
import { authInitialState } from '@/app/actions/auth-state';
import { AuthNetworkError } from '@/lib/auth/errors';

const { proxyMock, signUpMock, signInMock, signOutMock } = vi.hoisted(() => {
  const signUp = vi.fn();
  const signIn = vi.fn();
  const signOut = vi.fn();

  return {
    proxyMock: {
      signUp,
      signIn,
      signOut,
    },
    signUpMock: signUp,
    signInMock: signIn,
    signOutMock: signOut,
  };
});

vi.mock('@/lib/auth/supabaseAuthProxy', () => ({
  supabaseAuthProxy: proxyMock,
}));

const buildFormData = (fields: Record<string, string | undefined>): FormData => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== 'undefined') {
      form.set(key, value);
    }
  }
  return form;
};

beforeEach(() => {
  vi.clearAllMocks();
  proxyMock.signUp.mockReset();
  proxyMock.signIn.mockReset();
  proxyMock.signOut.mockReset();
});

describe('signUpAction', () => {
  it('rejects when fields are invalid', async () => {
    const result = await signUpAction(
      authInitialState,
      buildFormData({ email: '', password: '' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Informe e-mail e senha válidos.',
    });
    expect(proxyMock.signUp).not.toHaveBeenCalled();
  });

  it('propagates Supabase errors', async () => {
    signUpMock.mockResolvedValueOnce({ error: new Error('Email já usado.') });

    const result = await signUpAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({ status: 'error', message: 'Email já usado.' });
  });

  it('confirms success when Supabase creates the account', async () => {
    signUpMock.mockResolvedValueOnce({ error: null });

    const result = await signUpAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({
      status: 'success',
      message: 'Conta criada. Verifique seu e-mail.',
    });
  });

  it('falls back to friendly error when client fails', async () => {
    signUpMock.mockRejectedValueOnce(new Error('network down'));

    const result = await signUpAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'network down',
    });
  });
});

describe('signInAction', () => {
  it('rejects invalid payloads', async () => {
    const result = await signInAction(
      authInitialState,
      buildFormData({ email: '   ', password: '' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Informe e-mail e senha válidos.',
    });
  });

  it('returns Supabase error when login fails', async () => {
    signInMock.mockResolvedValueOnce({ error: new Error('Credenciais inválidas') });

    const result = await signInAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({ status: 'error', message: 'Credenciais inválidas' });
  });

  it('acknowledges successful sign in', async () => {
    signInMock.mockResolvedValueOnce({ error: null });

    const result = await signInAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({
      status: 'success',
      message: 'Login realizado com sucesso.',
    });
  });

  it('handles unexpected client errors', async () => {
    signInMock.mockRejectedValueOnce('timeout');

    const result = await signInAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({ status: 'error', message: 'Erro inesperado ao logar.' });
  });

  it('surfaces friendly message when DNS falha', async () => {
    signInMock.mockRejectedValueOnce(
      new AuthNetworkError('Não foi possível alcançar fqbf.supabase.co')
    );

    const result = await signInAction(
      authInitialState,
      buildFormData({ email: 'a@b.com', password: '123456' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Não foi possível alcançar fqbf.supabase.co',
    });
  });
});

describe('signOutAction', () => {
  it('signs out successfully', async () => {
    const result = await signOutAction();

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'success', message: 'Sessão encerrada.' });
  });

  it('reports failure when Supabase throws', async () => {
    signOutMock.mockRejectedValueOnce(new Error('Falha'));

    const result = await signOutAction();

    expect(result).toEqual({ status: 'error', message: 'Falha' });
  });
});
