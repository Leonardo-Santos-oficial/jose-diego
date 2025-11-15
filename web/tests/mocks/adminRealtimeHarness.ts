import type { AdminUserSummary, BalanceAdjustmentInput } from '@/modules/admin/types';
import type { AdminActionState } from '@/modules/admin/types/actionState';
import {
  createDemoTimelineMock,
  type TimelineEvent,
  type TimelineState,
  SupabaseTimelineMock,
  type WalletSnapshot,
} from '@/tests/mocks/supabaseTimeline';

const ADMIN_ID = 'admin-e2e';
type HarnessState = {
  timelineRef: { current: SupabaseTimelineMock };
  resultQueue: AdminActionState[];
  submissions: BalanceAdjustmentInput[];
};

declare global {
  var __adminRealtimeHarnessState: HarnessState | undefined;
}

const harnessState: HarnessState =
  globalThis.__adminRealtimeHarnessState ??
  (globalThis.__adminRealtimeHarnessState = {
    timelineRef: { current: createDemoTimelineMock() },
    resultQueue: [],
    submissions: [],
  });

const { timelineRef, resultQueue, submissions } = harnessState;

const seedUsers: AdminUserSummary[] = [
  {
    id: 'high-roller',
    email: 'vip@example.com',
    displayName: 'VIP',
    role: 'admin',
    balance: 1200,
    walletUpdatedAt: '2025-11-14T12:00:00Z',
  },
  {
    id: 'starter',
    email: 'starter@example.com',
    displayName: 'Starter',
    role: 'user',
    balance: 75,
    walletUpdatedAt: '2025-11-14T12:05:00Z',
  },
];

export type SerializedTimelineSnapshot = {
  wallets: WalletSnapshot[];
  bets: TimelineState['bets'];
  withdrawals: TimelineState['withdrawals'];
  events: TimelineEvent[];
};

export function resetAdminRealtimeHarness() {
  timelineRef.current = createDemoTimelineMock();
  resultQueue.length = 0;
  submissions.length = 0;
}

export function enqueueAdminResults(...states: AdminActionState[]) {
  resultQueue.push(...states);
}

export function replaceAdminResultQueue(states: AdminActionState[]) {
  resultQueue.length = 0;
  enqueueAdminResults(...states);
}

export async function simulateAdminAdjustment(
  payload: BalanceAdjustmentInput
): Promise<AdminActionState> {
  submissions.push(payload);
  const response = resultQueue.shift();

  if (response) {
    if (response.status === 'success') {
      timelineRef.current.adjustBalance({
        userId: payload.userId,
        delta: payload.delta,
        reason: payload.reason,
        adminId: ADMIN_ID,
        timestamp: response.snapshot?.updatedAt,
      });

      if (!response.snapshot) {
        const latest = timelineRef.current.snapshot().wallets.get(payload.userId);
        return latest
          ? {
              ...response,
              snapshot: { balance: latest.balance, updatedAt: latest.updatedAt },
            }
          : response;
      }
    }

    return response;
  }

  const updatedAt = new Date().toISOString();
  timelineRef.current.adjustBalance({
    userId: payload.userId,
    delta: payload.delta,
    reason: payload.reason,
    adminId: ADMIN_ID,
    timestamp: updatedAt,
  });

  const latest = timelineRef.current.snapshot().wallets.get(payload.userId);

  return {
    status: 'success',
    message:
      payload.delta >= 0
        ? `Crédito simulado (+${payload.delta})`
        : `Débito simulado (${payload.delta})`,
    snapshot: latest
      ? {
          balance: latest.balance,
          updatedAt: latest.updatedAt,
        }
      : undefined,
  } satisfies AdminActionState;
}

export function getSerializedTimelineSnapshot(): SerializedTimelineSnapshot {
  const snapshot = timelineRef.current.snapshot();
  return {
    wallets: Array.from(snapshot.wallets.values()),
    bets: snapshot.bets,
    withdrawals: snapshot.withdrawals,
    events: snapshot.events,
  };
}

export function getAdminRealtimeUsers(): AdminUserSummary[] {
  const snapshot = timelineRef.current.snapshot();
  return seedUsers.map((user) => {
    const wallet = snapshot.wallets.get(user.id);
    return {
      ...user,
      balance: wallet?.balance ?? user.balance,
      walletUpdatedAt: wallet?.updatedAt ?? user.walletUpdatedAt ?? null,
    };
  });
}

export function getAdminSubmissions() {
  return [...submissions];
}

export function timelineHasEvents() {
  return timelineRef.current.snapshot().events.length > 0;
}
