import { render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminActionState } from '@/modules/admin/types/actionState';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import type { AdminUserSummary } from '@/modules/admin/types';
import { submitReactActionForm } from '@/tests/utils/submitReactAction';

type Submission = Record<string, string>;

const { submissions, adjustBalanceActionMock } = vi.hoisted(() => {
  const submissions: Submission[] = [];
  const adjustBalanceActionMock = vi.fn(
    async (
      _prevState: AdminActionState,
      formData: FormData
    ): Promise<AdminActionState> => {
      submissions.push(Object.fromEntries(formData.entries()) as Submission);
      return { status: 'success', message: 'ok' } satisfies AdminActionState;
    }
  );

  return { submissions, adjustBalanceActionMock };
}) as {
  submissions: Submission[];
  adjustBalanceActionMock: ReturnType<typeof vi.fn>;
};

vi.mock('@/app/actions/admin', () => ({
  adjustBalanceAction: adjustBalanceActionMock,
}));

const sampleUsers: AdminUserSummary[] = [
  {
    id: 'low-balance',
    email: 'low@example.com',
    displayName: 'Low',
    role: 'user',
    balance: 25,
  },
  {
    id: 'high-balance',
    email: 'high@example.com',
    displayName: 'High',
    role: 'admin',
    balance: 250,
  },
];

beforeEach(() => {
  submissions.length = 0;
  adjustBalanceActionMock.mockClear();
});

describe('AdminUserTable', () => {
  it('renders users ordered by balance and exposes per-row forms', () => {
    render(<AdminUserTable users={sampleUsers} />);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);

    const [firstRow, secondRow] = rows;
    expect(within(firstRow).getByText('high@example.com')).toBeInTheDocument();
    expect(within(secondRow).getByText('low@example.com')).toBeInTheDocument();

    const hiddenInput = within(firstRow).getByDisplayValue(
      'high-balance'
    ) as HTMLInputElement;
    expect(hiddenInput).toHaveAttribute('type', 'hidden');
  });

  it('submits the hidden user id when a row form is posted', async () => {
    render(<AdminUserTable users={sampleUsers} />);

    const [firstRow] = screen.getAllByRole('row').slice(1);
    const amountInput = within(firstRow).getByPlaceholderText('± R$');
    const form = amountInput.closest('form');
    expect(form).toBeTruthy();

    await act(async () => {
      await submitReactActionForm(form!);
    });

    await waitFor(() => expect(adjustBalanceActionMock).toHaveBeenCalled());
    expect(submissions[0]).toMatchObject({ userId: 'high-balance' });
  });
});
