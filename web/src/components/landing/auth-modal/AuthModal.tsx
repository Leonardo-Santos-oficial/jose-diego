'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, signUpAction, signInWithGoogleAction } from '@/app/actions/auth';
import { createAuthInitialState } from '@/app/actions/auth-state';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/components/ui/dialog';
import { cn } from '@/components/lib/utils';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

type AuthMode = 'login' | 'signup';

const googleBrandHex = '#4285F4';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      focusable="false"
      role="img"
    >
      <path
        fill={googleBrandHex}
        d="M21.35 11.1h-9.4v2.91h5.62c-.24 1.44-1.7 4.23-5.62 4.23-3.39 0-6.16-2.8-6.16-6.24s2.77-6.24 6.16-6.24a5.9 5.9 0 0 1 3.77 1.35l2.61-2.52A9.81 9.81 0 0 0 11.95 2C6.46 2 2 6.48 2 12s4.46 10 9.95 10c5.74 0 9.55-4.04 9.55-9.74 0-.62-.09-1.1-.15-1.56Z"
      />
    </svg>
  );
}

function SubmitButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      aria-label="Entrar com conta Google"
      disabled={pending}
      className="group flex w-full items-center justify-center gap-3 rounded-2xl border-white/20 bg-slate-950/60 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      <GoogleIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
      <span className="truncate text-sm sm:text-base">
        {pending ? 'Conectando ao Google...' : 'Entrar com Google'}
      </span>
    </Button>
  );
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [signUpState, signUpFormAction] = useActionState(
    signUpAction,
    createAuthInitialState()
  );
  const [signInState, signInFormAction] = useActionState(
    signInAction,
    createAuthInitialState()
  );
  const [googleState, googleAction] = useActionState(
    signInWithGoogleAction,
    createAuthInitialState()
  );

  const activeState = useMemo(
    () => (mode === 'signup' ? signUpState : signInState),
    [mode, signInState, signUpState]
  );

  useEffect(() => {
    if (activeState.status === 'success') {
      onClose();
    }
  }, [activeState.status, onClose]);

  const getStatusClassName = (status: typeof activeState.status) =>
    cn(
      'rounded-md px-3 py-2 text-sm',
      status === 'success'
        ? 'bg-emerald-500/10 text-emerald-200'
        : status === 'error'
          ? 'bg-red-500/10 text-red-200'
          : null
    );

  const description = 'Supabase Auth garante hashing seguro (REQ-SEC-08/09).';

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <DialogContent className="w-full max-w-[460px] rounded-2xl sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{mode === 'signup' ? 'Criar conta' : 'Entrar'}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {activeState.message && activeState.status !== 'idle' && (
            <p
              className={getStatusClassName(activeState.status)}
              role="status"
              aria-live="polite"
            >
              {activeState.message}
            </p>
          )}

          {mode === 'signup' ? (
            <form className="space-y-4" action={signUpFormAction}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  name="email"
                  placeholder="voce@exemplo.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <SubmitButton
                idleLabel="Criar conta demo"
                pendingLabel="Criando conta..."
              />
            </form>
          ) : (
            <form className="space-y-4" action={signInFormAction}>
              <div className="space-y-2">
                <Label htmlFor="signin-email">E-mail</Label>
                <Input
                  id="signin-email"
                  type="email"
                  name="email"
                  placeholder="voce@exemplo.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Senha</Label>
                <Input
                  id="signin-password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>
              <SubmitButton idleLabel="Entrar" pendingLabel="Entrando..." />
            </form>
          )}

          <div className="space-y-3">
            <div className="relative py-2 text-center text-xs uppercase tracking-wide text-slate-500">
              <span className="bg-slate-950 px-3 text-slate-300">ou continue com</span>
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
            </div>
            <form action={googleAction}>
              <GoogleButton />
            </form>
            {googleState.message && googleState.status === 'error' ? (
              <p
                className={getStatusClassName(googleState.status)}
                role="status"
                aria-live="polite"
              >
                {googleState.message}
              </p>
            ) : null}
            <div
              className="rounded-2xl border border-white/5 bg-slate-900/40 p-3 text-xs text-slate-300 sm:text-sm"
              aria-live="polite"
            >
              <p className="sm:hidden">
                Ative o Google no seu smartphone para um toque rápido e seguro.
              </p>
              <p className="hidden sm:block lg:hidden">
                Em tablets, use o Google para pular a digitação de senhas.
              </p>
              <p className="hidden lg:block">
                No desktop, você pode alternar entre e-mail e Google sem perder a sessão.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          {mode === 'signup' ? (
            <Button type="button" variant="link" onClick={() => setMode('login')}>
              Já possui conta? Fazer login
            </Button>
          ) : (
            <Button type="button" variant="link" onClick={() => setMode('signup')}>
              Precisa se cadastrar? Criar conta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
