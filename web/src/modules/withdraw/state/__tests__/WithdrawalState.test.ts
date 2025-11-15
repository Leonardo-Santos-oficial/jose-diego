import { describe, expect, it, vi } from 'vitest';
import { createWithdrawalState } from '@/modules/withdraw/state/WithdrawalState';
import type { WithdrawRepository } from '@/modules/withdraw/repositories/withdrawRepository';
import type { WithdrawRequest } from '@/modules/withdraw/types';

const mockRepository = (): WithdrawRepository => ({
  create: vi.fn(),
  listAll: vi.fn(),
  listByUser: vi.fn(),
  getById: vi.fn(),
  updateStatus: vi.fn(),
});

const baseRequest: WithdrawRequest = {
  id: 'req-1',
  userId: 'user-1',
  amount: 100,
  status: 'pending',
  createdAt: '2025-11-15T00:00:00Z',
  updatedAt: '2025-11-15T00:00:00Z',
};

describe('withdrawal state machine', () => {
  it('permite aprovar quando pendente', async () => {
    const repository = mockRepository();
    const approveSpy = vi
      .spyOn(repository, 'updateStatus')
      .mockResolvedValue({ ...baseRequest, status: 'approved' });

    const state = createWithdrawalState(baseRequest, repository);
    const result = await state.approve();

    expect(approveSpy).toHaveBeenCalledWith('req-1', 'approved');
    expect(result.status).toBe('approved');
  });

  it('permite rejeitar quando pendente', async () => {
    const repository = mockRepository();
    const rejectSpy = vi
      .spyOn(repository, 'updateStatus')
      .mockResolvedValue({ ...baseRequest, status: 'rejected' });

    const state = createWithdrawalState(baseRequest, repository);
    const result = await state.reject();

    expect(rejectSpy).toHaveBeenCalledWith('req-1', 'rejected');
    expect(result.status).toBe('rejected');
  });

  it('bloqueia transições em estados finais', () => {
    const repository = mockRepository();
    const approvedState = createWithdrawalState(
      { ...baseRequest, status: 'approved' },
      repository
    );

    expect(() => approvedState.approve()).toThrow(
      'Transição inválida para status aprovado.'
    );
    expect(() => approvedState.reject()).toThrow(
      'Transição inválida para status rejeitado.'
    );
  });
});
