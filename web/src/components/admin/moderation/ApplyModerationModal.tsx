'use client';

import { useState, useActionState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Ban,
  ShieldOff,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import {
  applyModerationAction,
  purgeUserPlatformData,
} from '@/app/actions/moderation';
import { moderationActionInitialState } from '@/app/actions/moderation-state';
import type { ModerationActionType } from '@/modules/moderation';

interface ApplyModerationModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onActionApplied?: () => void;
}

const ACTION_OPTIONS: {
  type: ModerationActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}[] = [
  {
    type: 'warn',
    label: 'Advertir',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'Envia um aviso ao usuário',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  },
  {
    type: 'suspend',
    label: 'Suspender',
    icon: <Clock className="h-5 w-5" />,
    description: 'Bloqueia temporariamente o chat',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  },
  {
    type: 'block',
    label: 'Bloquear',
    icon: <ShieldOff className="h-5 w-5" />,
    description: 'Bloqueia permanentemente o chat',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  {
    type: 'ban',
    label: 'Banir',
    icon: <Ban className="h-5 w-5" />,
    description: 'Bane o usuário completamente',
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
  },
];

const SUSPENSION_DURATIONS = [
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 360, label: '6 horas' },
  { value: 1440, label: '24 horas' },
  { value: 4320, label: '3 dias' },
  { value: 10080, label: '7 dias' },
];

export function ApplyModerationModal({
  userId,
  userName,
  isOpen,
  onClose,
  onActionApplied,
}: ApplyModerationModalProps) {
  const [selectedAction, setSelectedAction] = useState<ModerationActionType | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeState, setPurgeState] = useState<
    | { status: 'idle' }
    | { status: 'success'; message: string; details: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [purgePending, setPurgePending] = useState(false);

  const [state, formAction, pending] = useActionState(
    applyModerationAction,
    moderationActionInitialState
  );

  useEffect(() => {
    if (state.status === 'success') {
      onActionApplied?.();
      onClose();
      setSelectedAction(null);
      setReason('');
      setDuration(60);
    }
  }, [state.status, onClose, onActionApplied]);

  useEffect(() => {
    if (!isOpen) {
      setShowPurgeConfirm(false);
      setPurgeState({ status: 'idle' });
      setPurgePending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedOption = ACTION_OPTIONS.find((o) => o.type === selectedAction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Moderar Usuário</h2>
              <p className="text-sm text-slate-400">{userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Limpar dados do usuário</p>
              <p className="text-xs text-slate-400">
                Apaga conversas do suporte, chat global e pedidos (saques/apostas).
              </p>
            </div>

            {!showPurgeConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowPurgeConfirm(true)}
                disabled={purgePending || pending}
                className="sm:self-end"
              >
                <Trash2 className="h-4 w-4" />
                Apagar tudo
              </Button>
            ) : (
              <div className="flex gap-2 sm:self-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPurgeConfirm(false)}
                  disabled={purgePending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={purgePending}
                  onClick={async () => {
                    setPurgePending(true);
                    setPurgeState({ status: 'idle' });
                    const result = await purgeUserPlatformData(userId);
                    if (result.status === 'success') {
                      const details =
                        `Chat global: ${result.deleted.globalChatMessages} • ` +
                        `Suporte msgs: ${result.deleted.chatMessages} • ` +
                        `Suporte threads: ${result.deleted.chatThreads} • ` +
                        `Saques: ${result.deleted.withdrawRequests} • ` +
                        `Apostas: ${result.deleted.bets}`;
                      setPurgeState({
                        status: 'success',
                        message: result.message,
                        details,
                      });
                      setShowPurgeConfirm(false);
                      onActionApplied?.();
                    } else {
                      setPurgeState({ status: 'error', message: result.message });
                    }
                    setPurgePending(false);
                  }}
                >
                  Confirmar
                </Button>
              </div>
            )}
          </div>

          {showPurgeConfirm && (
            <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              Atenção: esta ação é permanente e não pode ser desfeita.
            </p>
          )}

          {purgeState.status === 'success' && (
            <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <p className="font-medium">{purgeState.message}</p>
              <p className="mt-1 text-emerald-200/80">{purgeState.details}</p>
            </div>
          )}

          {purgeState.status === 'error' && (
            <div className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {purgeState.message}
            </div>
          )}
        </div>

        {!selectedAction ? (
          <div className="grid grid-cols-2 gap-3">
            {ACTION_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedAction(option.type)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:scale-[1.02] ${option.color}`}
              >
                {option.icon}
                <span className="font-medium">{option.label}</span>
                <span className="text-center text-xs opacity-70">{option.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="actionType" value={selectedAction} />

            <div
              className={`flex items-center gap-3 rounded-xl border p-4 ${selectedOption?.color}`}
            >
              {selectedOption?.icon}
              <div>
                <span className="font-medium">{selectedOption?.label}</span>
                <p className="text-xs opacity-70">{selectedOption?.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="ml-auto rounded-lg p-1 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedAction === 'suspend' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Duração da suspensão
                </label>
                <select
                  name="durationMinutes"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {SUSPENSION_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Motivo {selectedAction === 'ban' ? '(mínimo 10 caracteres)' : '(mínimo 5 caracteres)'}
              </label>
              <textarea
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da ação..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
                minLength={selectedAction === 'ban' ? 10 : 5}
              />
            </div>

            {state.status === 'error' && state.message && (
              <p className="rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
                {state.message}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1"
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
                disabled={pending}
              >
                {pending ? 'Aplicando...' : 'Confirmar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
