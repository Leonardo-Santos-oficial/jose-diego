'use client';

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Search,
  Filter,
  Users,
  Activity,
  UserSearch,
  Loader2,
  Mail,
  User,
} from 'lucide-react';
import { ModerationHistoryList } from './ModerationHistoryList';
import { ApplyModerationModal } from './ApplyModerationModal';
import type { ModerationAction, ModerationActionType } from '@/modules/moderation';
import {
  searchUsersForModeration,
  type UserSearchResult,
} from '@/app/actions/moderation';

interface AdminModerationDashboardProps {
  initialActions: ModerationAction[];
}

const ACTION_FILTERS: { type: ModerationActionType | 'all'; label: string }[] = [
  { type: 'all', label: 'Todas' },
  { type: 'warn', label: 'Advertências' },
  { type: 'suspend', label: 'Suspensões' },
  { type: 'block', label: 'Bloqueios' },
  { type: 'ban', label: 'Banimentos' },
];

const STATUS_FILTERS = [
  { status: 'all', label: 'Todos' },
  { status: 'active', label: 'Ativas' },
  { status: 'expired', label: 'Expiradas' },
  { status: 'revoked', label: 'Revogadas' },
];

export function AdminModerationDashboard({ initialActions }: AdminModerationDashboardProps) {
  const router = useRouter();
  const [actions, setActions] = useState(initialActions);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ModerationActionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);

  // Sincroniza estado local quando initialActions muda (após router.refresh())
  useEffect(() => {
    setActions(initialActions);
  }, [initialActions]);

  // Callback para quando uma ação for revogada
  const handleActionRevoked = useCallback((actionId: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === actionId
          ? { ...action, status: 'revoked' as const, revokedAt: new Date().toISOString() }
          : action
      )
    );
    // Também força revalidação dos dados do servidor
    router.refresh();
  }, [router]);

  // Callback para quando uma nova ação for aplicada
  const handleActionApplied = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleUserSearch = useCallback(
    (query: string) => {
      setUserSearchQuery(query);

      if (query.length < 2) {
        setUserSearchResults([]);
        return;
      }

      startSearchTransition(async () => {
        const results = await searchUsersForModeration(query);
        setUserSearchResults(results);
      });
    },
    []
  );

  const handleSelectUser = useCallback((user: UserSearchResult) => {
    setSelectedUser(user);
    setShowModerationModal(true);
    setUserSearchQuery('');
    setUserSearchResults([]);
  }, []);

  const stats = useMemo(() => {
    const active = actions.filter((a) => a.status === 'active');
    return {
      total: actions.length,
      active: active.length,
      warns: active.filter((a) => a.actionType === 'warn').length,
      suspensions: active.filter((a) => a.actionType === 'suspend').length,
      blocks: active.filter((a) => a.actionType === 'block').length,
      bans: active.filter((a) => a.actionType === 'ban').length,
      uniqueUsers: new Set(actions.map((a) => a.userId)).size,
    };
  }, [actions]);

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (typeFilter !== 'all' && action.actionType !== typeFilter) {
        return false;
      }

      if (statusFilter !== 'all' && action.status !== statusFilter) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          action.reason.toLowerCase().includes(query) ||
          action.adminName.toLowerCase().includes(query) ||
          action.userId.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [actions, typeFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20">
          <ShieldAlert className="h-6 w-6 text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Moderação</h2>
          <p className="text-sm text-slate-400">
            Gerencie ações de moderação e usuários problemáticos
          </p>
        </div>
      </div>

      {/* Buscar Usuário para Moderar */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <UserSearch className="h-5 w-5 text-teal-400" />
          <h3 className="font-medium text-teal-300">Buscar Usuário para Moderar</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por email, nome ou ID do usuário..."
            value={userSearchQuery}
            onChange={(e) => handleUserSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-400" />
          )}
        </div>

        {/* Resultados da busca */}
        {userSearchResults.length > 0 && (
          <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-slate-800/80">
            {userSearchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-slate-700/50 last:border-b-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user.displayName || 'Sem nome'}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              </button>
            ))}
          </div>
        )}

        {userSearchQuery.length >= 2 && !isSearching && userSearchResults.length === 0 && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Nenhum usuário encontrado
          </p>
        )}

        {userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Digite pelo menos 2 caracteres para buscar
          </p>
        )}
      </div>

      {/* Modal de moderação */}
      {selectedUser && (
        <ApplyModerationModal
          userId={selectedUser.id}
          userName={selectedUser.displayName ?? selectedUser.email}
          isOpen={showModerationModal}
          onClose={() => {
            setShowModerationModal(false);
            setSelectedUser(null);
          }}
          onActionApplied={handleActionApplied}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Ações Ativas"
          value={stats.active}
          color="rose"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Advertências"
          value={stats.warns}
          color="yellow"
        />
        <StatCard
          icon={<Ban className="h-5 w-5" />}
          label="Banimentos"
          value={stats.bans}
          color="red"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Usuários Moderados"
          value={stats.uniqueUsers}
          color="slate"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por motivo, admin ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ModerationActionType | 'all')}
                className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
              >
                {ACTION_FILTERS.map((f) => (
                  <option key={f.type} value={f.type}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.status} value={f.status}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-3">
          Mostrando {filteredActions.length} de {actions.length} ações
        </div>

        <ModerationHistoryList actions={filteredActions} onActionRevoked={handleActionRevoked} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'rose' | 'yellow' | 'red' | 'slate' | 'teal';
}) {
  const colorClasses = {
    rose: 'bg-rose-500/10 text-rose-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    slate: 'bg-slate-500/10 text-slate-400',
    teal: 'bg-teal-500/10 text-teal-400',
  };

  return (
    <div className="rounded-xl border border-white/5 bg-slate-800/30 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
