'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import {
  createInitialProfileActionState,
  type ProfileActionState,
} from '@/app/actions/profile-state';
import { cn } from '@/components/lib/utils';

export type ProfileFormProps = {
  initialDisplayName: string;
  initialPixKey: string;
  userEmail: string;
};

export function ProfileForm({
  initialDisplayName,
  initialPixKey,
  userEmail,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    createInitialProfileActionState()
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(15,118,110,0.2)] md:p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
          Perfil do jogador
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Dados da conta e chave Pix
        </h1>
        <p className="text-sm text-slate-400">
          Use um nome de exibição para aparecer no topo do app e informe a chave Pix que
          será utilizada nas solicitações de saque simuladas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="displayName" className="text-sm font-semibold text-slate-200">
            Nome de exibição
          </label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={initialDisplayName}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            placeholder="Ex.: Capitão Demo"
            maxLength={60}
            disabled={pending}
          />
          <p className="mt-1 text-xs text-slate-400">
            Mostrado no cabeçalho e no painel admin.
          </p>
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-200">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            value={userEmail}
            disabled
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-base text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            O e-mail é gerenciado pelo Supabase Auth.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="pixKey" className="text-sm font-semibold text-slate-200">
          Chave Pix principal
        </label>
        <textarea
          id="pixKey"
          name="pixKey"
          defaultValue={initialPixKey}
          rows={3}
          maxLength={140}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          placeholder="Digite CPF, e-mail ou chave aleatória..."
          disabled={pending}
        />
        <p className="mt-1 text-xs text-slate-400">
          Este valor aparece para o administrador quando você solicitar um saque.
        </p>
      </div>

      {state.message ? (
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm font-medium',
            state.status === 'success'
              ? 'border border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
              : 'border border-rose-400/60 bg-rose-500/10 text-rose-200'
          )}
          role="status"
        >
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            'rounded-full bg-teal-500/80 px-8 py-3 text-base font-semibold text-slate-950 shadow-lg transition hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300',
            pending && 'cursor-not-allowed opacity-60'
          )}
        >
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <p className="text-xs text-slate-500">
          Última atualização segura e validada no servidor.
        </p>
      </div>
    </form>
  );
}
