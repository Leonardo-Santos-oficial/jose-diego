import { describe, expect, it, vi } from 'vitest';

import { WithdrawService } from '@/modules/withdraw/services/withdrawService';
import type { WithdrawRepository } from '@/modules/withdraw/repositories/withdrawRepository';
import type { WithdrawRequest } from '@/modules/withdraw/types';

type RepositoryMock = WithdrawRepository & {
  [K in keyof WithdrawRepository]: ReturnType<typeof vi.fn>;
};

const buildRepository = (): RepositoryMock => {
  return {
    create: vi.fn(),
    listAll: vi.fn(),
    listByUser: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
  } as RepositoryMock;
};

const sampleRequest: WithdrawRequest = {
  id: 'req-1',
  userId: 'user-1',
  amount: 150,
  status: 'pending',
  createdAt: '2025-11-15T10:00:00.000Z',
  updatedAt: '2025-11-15T10:00:00.000Z',
};

describe('WithdrawService', () => {
  it('rejeita valores inválidos ao solicitar saque', () => {
    const repository = buildRepository();
    const service = new WithdrawService(repository);

    expect(() => service.requestWithdraw({ userId: 'user-1', amount: 0 })).toThrow(
      'Informe um valor válido para saque.'
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('cria solicitações válidas através do repositório', async () => {
    const repository = buildRepository();
    repository.create.mockResolvedValueOnce(sampleRequest);
    const service = new WithdrawService(repository);

    await expect(
      service.requestWithdraw({ userId: 'user-1', amount: 150 })
    ).resolves.toEqual(sampleRequest);
    expect(repository.create).toHaveBeenCalledWith({ userId: 'user-1', amount: 150 });
  });

  it('aprova solicitações pendentes usando a máquina de estados', async () => {
    const repository = buildRepository();
    repository.getById.mockResolvedValue(sampleRequest);
    repository.updateStatus.mockResolvedValue({ ...sampleRequest, status: 'approved' });
    const service = new WithdrawService(repository);

    await expect(service.approve(sampleRequest.id)).resolves.toMatchObject({
      status: 'approved',
    });
    expect(repository.getById).toHaveBeenCalledWith(sampleRequest.id);
    expect(repository.updateStatus).toHaveBeenCalledWith(sampleRequest.id, 'approved');
  });

  it('rejeita solicitações inexistentes', async () => {
    const repository = buildRepository();
    repository.getById.mockResolvedValue(null);
    const service = new WithdrawService(repository);

    await expect(service.approve('unknown')).rejects.toThrow(
      'Solicitação de saque não encontrada.'
    );
  });
});
