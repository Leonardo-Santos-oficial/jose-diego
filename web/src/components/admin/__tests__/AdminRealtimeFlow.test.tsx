import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminActionState } from '@/modules/admin/types/actionState';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import type { AdminUserSummary } from '@/modules/admin/types';
import {
  createDemoTimelineMock,
  type TimelineEvent,
  SupabaseTimelineMock,
} from '@/tests/mocks/supabaseTimeline';
import { submitReactActionForm } from '@/tests/utils/submitReactAction';

type Submission = Record<string, string>;

const timelineRef: { current: SupabaseTimelineMock } = {
  current: createDemoTimelineMock(),
};
const submissions: Submission[] = [];
const resultQueue: AdminActionState[] = [];

async function handleAdjustBalance(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const payload = Object.fromEntries(formData.entries()) as Submission;
  submissions.push(payload);
  const response =
    resultQueue.shift() ??
    ({
      status: 'success',
      message: 'OK',
      snapshot: { balance: 0, updatedAt: new Date().toISOString() },
    } satisfies AdminActionState);

  if (response.status === 'success' && response.snapshot) {
    timelineRef.current.adjustBalance({
      userId: payload.userId,
      delta: Number(payload.delta),
      reason: payload.reason,
      adminId: 'admin-simulated',
      timestamp: response.snapshot.updatedAt,
    });
  }

  return response;
}

const { adjustBalanceActionMock } = vi.hoisted(() => ({
  adjustBalanceActionMock: vi.fn(handleAdjustBalance),
}));

vi.mock('@/app/actions/admin', () => ({
  adjustBalanceAction: adjustBalanceActionMock,
}));

const sampleUsers: AdminUserSummary[] = [
  {
    id: 'high-roller',
    email: 'vip@example.com',
    displayName: 'VIP',
    role: 'admin',
    balance: 1200,
  },
  {
    id: 'starter',
    email: 'starter@example.com',
    displayName: 'Starter',
    role: 'user',
    balance: 75,
  },
];

const getFormFromRow = (row: HTMLElement) => {
  const input = within(row).getByPlaceholderText('± R$');
  return input.closest('form') as HTMLFormElement;
};

beforeEach(() => {
  timelineRef.current = createDemoTimelineMock();
  submissions.length = 0;
  resultQueue.length = 0;
  adjustBalanceActionMock.mockClear();
});

describe('Admin realtime flow', () => {
  it('streams sequential adjustments and surfaces concurrency errors', async () => {
    const user = userEvent.setup();
    resultQueue.push(
      {
        status: 'success',
        message: 'Crédito aplicado (+200)',
        snapshot: { balance: 1400, updatedAt: '2025-11-14T13:00:00Z' },
      },
      {
        status: 'error',
        message: 'Saldo desatualizado. Atualize a página.',
      },
      {
        status: 'success',
        message: 'Débito processado (-15)',
        snapshot: { balance: 60, updatedAt: '2025-11-14T13:05:00Z' },
      }
    );

    render(<AdminUserTable users={sampleUsers} />);
    const [vipRow, starterRow] = screen.getAllByRole('row').slice(1);

    const vipAmount = within(vipRow).getByPlaceholderText('± R$');
    const vipReason = within(vipRow).getByPlaceholderText('Motivo (opcional)');
    await user.type(vipAmount, '200');
    await user.type(vipReason, 'Promo 11/11');
    await act(async () => {
      await submitReactActionForm(getFormFromRow(vipRow));
    });

    await within(vipRow).findByText('Crédito aplicado (+200)');
    const vipWallet = timelineRef.current.snapshot().wallets.get('high-roller');
    expect(vipWallet?.balance).toBe(1400);

    await user.clear(vipAmount);
    await user.type(vipAmount, '50');
    await act(async () => {
      await submitReactActionForm(getFormFromRow(vipRow));
    });

    await within(vipRow).findByText('Saldo desatualizado. Atualize a página.');

    const starterAmount = within(starterRow).getByPlaceholderText('± R$');
    const starterReason = within(starterRow).getByPlaceholderText('Motivo (opcional)');
    await user.type(starterAmount, '-15');
    await user.type(starterReason, 'Ajuste manual');
    await act(async () => {
      await submitReactActionForm(getFormFromRow(starterRow));
    });

    await within(starterRow).findByText('Débito processado (-15)');
    const starterWallet = timelineRef.current.snapshot().wallets.get('starter');
    expect(starterWallet?.balance).toBe(60);

    expect(submissions).toHaveLength(3);
    expect(
      timelineRef.current
        .snapshot()
        .events.filter((event: TimelineEvent) => event.type === 'wallet_adjusted')
    ).toHaveLength(2);
  });
});
