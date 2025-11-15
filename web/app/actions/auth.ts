'use server';

import type { AuthFormState } from '@/app/actions/auth-state';
import { AuthConfigurationError, AuthNetworkError } from '@/lib/auth/errors';
import { supabaseAuthProxy } from '@/lib/auth/supabaseAuthProxy';

const validateField = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value.trim();
};

const authGateway = supabaseAuthProxy;

const handleAuthError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AuthNetworkError) {
    return { status: 'error', message: error.message } as AuthFormState;
  }

  if (error instanceof AuthConfigurationError) {
    return { status: 'error', message: error.message } as AuthFormState;
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return { status: 'error', message } as AuthFormState;
};

export async function signUpAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = validateField(formData.get('email'));
  const password = validateField(formData.get('password'));

  if (!email || !password) {
    return { status: 'error', message: 'Informe e-mail e senha válidos.' };
  }

  try {
    const { error } = await authGateway.signUp({ email, password });

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Conta criada. Verifique seu e-mail.' };
  } catch (error) {
    return handleAuthError(error, 'Erro inesperado ao cadastrar.');
  }
}

export async function signInAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = validateField(formData.get('email'));
  const password = validateField(formData.get('password'));

  if (!email || !password) {
    return { status: 'error', message: 'Informe e-mail e senha válidos.' };
  }

  try {
    const { error } = await authGateway.signIn({ email, password });

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Login realizado com sucesso.' };
  } catch (error) {
    return handleAuthError(error, 'Erro inesperado ao logar.');
  }
}

export async function signOutAction(): Promise<AuthFormState> {
  try {
    await authGateway.signOut();
    return { status: 'success', message: 'Sessão encerrada.' };
  } catch (error) {
    return handleAuthError(error, 'Erro ao encerrar sessão.');
  }
}
