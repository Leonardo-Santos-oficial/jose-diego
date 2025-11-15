'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, signUpAction } from '@/app/actions/auth';
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

function SubmitButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full text-base font-semibold">
      {pending ? pendingLabel : idleLabel}
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

  const activeState = useMemo(
    () => (mode === 'signup' ? signUpState : signInState),
    [mode, signInState, signUpState]
  );

  useEffect(() => {
    if (activeState.status === 'success') {
      onClose();
    }
  }, [activeState.status, onClose]);

  const statusClassName = cn(
    'rounded-md px-3 py-2 text-sm',
    activeState.status === 'success'
      ? 'bg-emerald-500/10 text-emerald-200'
      : activeState.status === 'error'
        ? 'bg-red-500/10 text-red-200'
        : null
  );

  const description = 'Supabase Auth garante hashing seguro (REQ-SEC-08/09).';

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{mode === 'signup' ? 'Criar conta' : 'Entrar'}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {activeState.message && activeState.status !== 'idle' && (
          <p className={statusClassName}>{activeState.message}</p>
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
            <SubmitButton idleLabel="Criar conta demo" pendingLabel="Criando conta..." />
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
