import type { WithdrawRepository } from '@/modules/withdraw/repositories/withdrawRepository';
import type { WithdrawRequest } from '@/modules/withdraw/types';

export interface WithdrawalState {
  readonly request: WithdrawRequest;
  approve(): Promise<WithdrawRequest>;
  reject(): Promise<WithdrawRequest>;
}

abstract class BaseWithdrawalState implements WithdrawalState {
  constructor(
    public readonly request: WithdrawRequest,
    protected readonly repository: WithdrawRepository
  ) {}

  approve(): Promise<WithdrawRequest> {
    throw new Error('Transição inválida para status aprovado.');
  }

  reject(): Promise<WithdrawRequest> {
    throw new Error('Transição inválida para status rejeitado.');
  }
}

class PendingWithdrawalState extends BaseWithdrawalState {
  async approve(): Promise<WithdrawRequest> {
    return this.repository.updateStatus(this.request.id, 'approved');
  }

  async reject(): Promise<WithdrawRequest> {
    return this.repository.updateStatus(this.request.id, 'rejected');
  }
}

class ApprovedWithdrawalState extends BaseWithdrawalState {}

class RejectedWithdrawalState extends BaseWithdrawalState {}

export function createWithdrawalState(
  request: WithdrawRequest,
  repository: WithdrawRepository
): WithdrawalState {
  switch (request.status) {
    case 'pending':
      return new PendingWithdrawalState(request, repository);
    case 'approved':
      return new ApprovedWithdrawalState(request, repository);
    case 'rejected':
      return new RejectedWithdrawalState(request, repository);
    default:
      return new PendingWithdrawalState(request, repository);
  }
}
