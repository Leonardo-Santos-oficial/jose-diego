'use client';

import { useState } from 'react';
import { Users, Gamepad2, Receipt, Wallet, ShieldAlert } from 'lucide-react';
import { AdminTabs, AdminTabPanel, type AdminTabConfig } from './AdminTabs';
import type { AdminUserSummary } from '@/modules/admin/types';
import type { AdminBetHistoryEntry } from '@/modules/admin/services/betHistoryService';
import type { WithdrawRequest } from '@/modules/withdraw/types';
import { AdminUserTable } from './AdminUserTable';
import { GameControlPanel } from './GameControlPanel';
import { AdminBetsTable } from './AdminBetsTable';
import { AdminWithdrawalsPanel } from './AdminWithdrawalsPanel';

const TABS: AdminTabConfig[] = [
  { id: 'users', label: 'Usuários', icon: <Users className="size-6" /> },
  { id: 'game', label: 'Controle do Jogo', icon: <Gamepad2 className="size-6" /> },
  { id: 'bets', label: 'Apostas', icon: <Receipt className="size-6" /> },
  { id: 'withdrawals', label: 'Saques', icon: <Wallet className="size-6" /> },
  { id: 'moderation', label: 'Moderação', icon: <ShieldAlert className="size-6" /> },
];

interface AdminDashboardProps {
  users: AdminUserSummary[];
  bets: AdminBetHistoryEntry[];
  betsCurrentPage: number;
  betsTotalPages: number;
  withdrawRequests: WithdrawRequest[];
  chatInboxSection: React.ReactNode;
  chatAnalyticsSection: React.ReactNode;
  moderationSection: React.ReactNode;
}

export function AdminDashboard({
  users,
  bets,
  betsCurrentPage,
  betsTotalPages,
  withdrawRequests,
  chatInboxSection,
  chatAnalyticsSection,
  moderationSection,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">Painel Administrativo</h1>
        <p className="text-xs text-slate-400 sm:text-sm">
          Gerencie usuários, jogo, apostas e saques.
        </p>
      </header>

      <AdminTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminTabPanel isActive={activeTab === 'users'}>
        <div className="space-y-6">
          <AdminUserTable users={users} />
          {chatInboxSection}
          {chatAnalyticsSection}
        </div>
      </AdminTabPanel>

      <AdminTabPanel isActive={activeTab === 'game'}>
        <GameControlPanel />
      </AdminTabPanel>

      <AdminTabPanel isActive={activeTab === 'bets'}>
        <AdminBetsTable
          bets={bets}
          currentPage={betsCurrentPage}
          totalPages={betsTotalPages}
        />
      </AdminTabPanel>

      <AdminTabPanel isActive={activeTab === 'withdrawals'}>
        <AdminWithdrawalsPanel requests={withdrawRequests} />
      </AdminTabPanel>

      <AdminTabPanel isActive={activeTab === 'moderation'}>
        {moderationSection}
      </AdminTabPanel>
    </div>
  );
}
