'use client';

import {
  AlertTriangle,
  Ban,
  Clock,
  ShieldOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { UserModerationState } from '@/modules/moderation';

interface UserModerationStatusBadgeProps {
  state: UserModerationState | null;
  compact?: boolean;
}

export function UserModerationStatusBadge({
  state,
  compact = false,
}: UserModerationStatusBadgeProps) {
  if (!state) return null;

  if (state.canChat && state.warningCount === 0) {
    if (compact) return null;

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs text-teal-400">
        <CheckCircle className="h-3 w-3" />
        Liberado
      </span>
    );
  }

  const badges: React.ReactNode[] = [];

  if (state.isBanned) {
    badges.push(
      <span
        key="banned"
        className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400"
      >
        <Ban className="h-3 w-3" />
        {compact ? '' : 'Banido'}
      </span>
    );
  }

  if (state.isBlocked && !state.isBanned) {
    badges.push(
      <span
        key="blocked"
        className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400"
      >
        <ShieldOff className="h-3 w-3" />
        {compact ? '' : 'Bloqueado'}
      </span>
    );
  }

  if (state.isSuspended && !state.isBanned && !state.isBlocked) {
    badges.push(
      <span
        key="suspended"
        className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400"
      >
        <Clock className="h-3 w-3" />
        {compact ? '' : 'Suspenso'}
      </span>
    );
  }

  if (state.warningCount > 0 && !state.isBanned && !state.isBlocked) {
    badges.push(
      <span
        key="warnings"
        className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400"
      >
        <AlertTriangle className="h-3 w-3" />
        {compact ? state.warningCount : `${state.warningCount} ${state.warningCount === 1 ? 'advertência' : 'advertências'}`}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex flex-wrap items-center gap-1">{badges}</div>;
}
