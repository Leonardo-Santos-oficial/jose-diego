import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminActionState } from '@/modules/admin/types/actionState';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import type { AdminUserSummary } from '@/modules/admin/types';
import { submitReactActionForm } from '@/tests/utils/submitReactAction';

type Submission = Record<string, string>;

const { submissions, resultQueue, adjustBalanceActionMock } = vi.hoisted(() => {
  const submissions: Submission[] = [];
  const resultQueue: AdminActionState[] = [];
  const adjustBalanceActionMock = vi.fn(
    async (
      _prevState: AdminActionState,
      formData: FormData
    ): Promise<AdminActionState> => {
      submissions.push(Object.fromEntries(formData.entries()) as Submission);
      return resultQueue.shift() ?? { status: 'success', message: 'Saldo atualizado.' };
    }
  );

  return { submissions, resultQueue, adjustBalanceActionMock };
}) as {
  submissions: Submission[];
  resultQueue: AdminActionState[];
  adjustBalanceActionMock: ReturnType<typeof vi.fn>;
};

const enqueueActionResult = (result: AdminActionState) => {
  resultQueue.push(result);
};

vi.mock('@/app/actions/admin', () => ({
  adjustBalanceAction: adjustBalanceActionMock,
}));

const sampleUsers: AdminUserSummary[] = [
  {
    id: 'high-balance',
    email: 'high@example.com',
    displayName: 'High',
    role: 'admin',
    balance: 250,
  },
  {
    id: 'low-balance',
    email: 'low@example.com',
    displayName: 'Low',
    role: 'user',
    balance: 25,
  },
];

beforeEach(() => {
  submissions.length = 0;
  resultQueue.length = 0;
  adjustBalanceActionMock.mockClear();
});

describe('Admin balance flow', () => {
  it('shows responses beside the right row and keeps submissions isolated', async () => {
    const user = userEvent.setup();
    render(<AdminUserTable users={sampleUsers} />);

    const [richRow, poorRow] = screen.getAllByRole('row').slice(1);

    const richDelta = within(richRow).getByPlaceholderText('± R$');
    const richReason = within(richRow).getByPlaceholderText('Motivo (opcional)');
    enqueueActionResult({
      status: 'success',
      message: 'Saldo creditado em +50.',
      snapshot: { balance: 300, updatedAt: '2024-05-01T12:00:00Z' },
    });

    await user.type(richDelta, '50');
    await user.type(richReason, 'Bônus');
    const richForm = richDelta.closest('form');
    expect(richForm).toBeTruthy();
    await act(async () => {
      await submitReactActionForm(richForm!);
    });

    await within(richRow).findByText('Saldo creditado em +50.');
    expect(submissions[0]).toMatchObject({
      userId: 'high-balance',
      delta: '50',
      reason: 'Bônus',
    });

    const poorDelta = within(poorRow).getByPlaceholderText('± R$');
    const poorReason = within(poorRow).getByPlaceholderText('Motivo (opcional)');
    enqueueActionResult({ status: 'error', message: 'Saldo insuficiente.' });

    await user.type(poorDelta, '-100');
    await user.type(poorReason, 'Ajuste manual');
    const poorForm = poorDelta.closest('form');
    expect(poorForm).toBeTruthy();
    await act(async () => {
      await submitReactActionForm(poorForm!);
    });

    await within(poorRow).findByText('Saldo insuficiente.');
    expect(submissions[1]).toMatchObject({
      userId: 'low-balance',
      delta: '-100',
      reason: 'Ajuste manual',
    });

    expect(within(richRow).queryByText('Saldo insuficiente.')).not.toBeInTheDocument();
  });
});
