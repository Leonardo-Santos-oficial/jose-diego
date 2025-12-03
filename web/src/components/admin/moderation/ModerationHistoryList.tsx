'use client';

import { useActionState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Ban,
  ShieldOff,
  Undo2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import {
  revokeModerationAction,
} from '@/app/actions/moderation';
import { moderationActionInitialState } from '@/app/actions/moderation-state';
import { formatRelativeTime, formatFutureRelativeTime } from '@/lib/utils/dateFormat';
import type { ModerationAction, ModerationActionType } from '@/modules/moderation';

interface ModerationHistoryListProps {
  actions: ModerationAction[];
  onActionRevoked?: (actionId: string) => void;
}

const ACTION_CONFIG: Record<
  ModerationActionType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  warn: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-yellow-400 bg-yellow-500/10',
    label: 'Advertência',
  },
  suspend: {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-orange-400 bg-orange-500/10',
    label: 'Suspensão',
  },
  block: {
    icon: <ShieldOff className="h-4 w-4" />,
    color: 'text-rose-400 bg-rose-500/10',
    label: 'Bloqueio',
  },
  ban: {
    icon: <Ban className="h-4 w-4" />,
    color: 'text-red-500 bg-red-500/10',
    label: 'Banimento',
  },
};

const STATUS_CONFIG: Record<
  ModerationAction['status'],
  { icon: React.ReactNode; color: string; label: string }
> = {
  active: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'text-rose-400 bg-rose-500/20',
    label: 'Ativa',
  },
  expired: {
    icon: <Clock className="h-3 w-3" />,
    color: 'text-slate-400 bg-slate-500/20',
    label: 'Expirada',
  },
  revoked: {
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'text-teal-400 bg-teal-500/20',
    label: 'Revogada',
  },
};

function RevokeButton({ actionId, onRevoked }: { actionId: string; onRevoked?: () => void }) {
  const [state, formAction, pending] = useActionState(
    revokeModerationAction,
    moderationActionInitialState
  );

  // Chama callback quando revogação for bem sucedida
  useEffect(() => {
    if (state.status === 'success' && onRevoked) {
      onRevoked();
    }
  }, [state.status, onRevoked]);

  return (
    <form action={formAction}>
      <input type="hidden" name="actionId" value={actionId} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="h-8 gap-1.5 text-xs text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
        disabled={pending}
      >
        <Undo2 className="h-3 w-3" />
        {pending ? 'Revogando...' : 'Revogar'}
      </Button>
      {state.status === 'error' && (
        <span className="ml-2 text-xs text-rose-400">{state.message}</span>
      )}
    </form>
  );
}

export function ModerationHistoryList({ actions, onActionRevoked }: ModerationHistoryListProps) {
  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-slate-800/30 p-6 text-center">
        <ShieldOff className="mx-auto mb-2 h-8 w-8 text-slate-500" />
        <p className="text-sm text-slate-400">Nenhuma ação de moderação registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const config = ACTION_CONFIG[action.actionType];
        const statusConfig = STATUS_CONFIG[action.status];
        const isActive = action.status === 'active';

        return (
          <div
            key={action.id}
            className={`rounded-xl border p-4 transition-all ${
              isActive
                ? 'border-rose-500/30 bg-rose-500/5'
                : 'border-white/5 bg-slate-800/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${config.color}`}>{config.icon}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{config.label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{action.reason}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      Por: <span className="text-slate-400">{action.adminName}</span>
                    </span>
                    <span>
                      {formatRelativeTime(action.createdAt)}
                    </span>
                    {action.expiresAt && (
                      <span className="text-orange-400">
                        Expira: {formatFutureRelativeTime(action.expiresAt)}
                      </span>
                    )}
                    {action.revokedAt && (
                      <span className="text-teal-400">
                        Revogada {formatRelativeTime(action.revokedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isActive && (
                <RevokeButton 
                  actionId={action.id} 
                  onRevoked={() => onActionRevoked?.(action.id)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}