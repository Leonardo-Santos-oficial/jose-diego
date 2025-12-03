'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import { ApplyModerationModal } from './ApplyModerationModal';
import { ModerationHistoryList } from './ModerationHistoryList';
import { UserModerationStatusBadge } from './UserModerationStatusBadge';
import type { UserModerationState, ModerationAction } from '@/modules/moderation';

interface UserModerationPanelProps {
  userId: string;
  userName: string;
  state: UserModerationState | null;
  history: ModerationAction[];
}

export function UserModerationPanel({
  userId,
  userName,
  state,
  history,
}: UserModerationPanelProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleActionApplied = () => {
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <ShieldAlert className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Moderação</h3>
            <p className="text-xs text-slate-400">{userName}</p>
          </div>
        </div>
        <UserModerationStatusBadge state={state} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowModal(true)}
          className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          size="sm"
        >
          <ShieldAlert className="h-4 w-4" />
          Aplicar Ação
        </Button>

        <Button
          onClick={() => setShowHistory(!showHistory)}
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-400 hover:text-white"
        >
          <History className="h-4 w-4" />
          Histórico ({history.length})
          {showHistory ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-4">
          <ModerationHistoryList actions={history} />
        </div>
      )}

      <ApplyModerationModal
        userId={userId}
        userName={userName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onActionApplied={handleActionApplied}
      />
    </div>
  );
}
