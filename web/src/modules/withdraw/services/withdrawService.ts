import { createWithdrawRepository } from '@/modules/withdraw/repositories/withdrawRepository';
import type { WithdrawRepository } from '@/modules/withdraw/repositories/withdrawRepository';
import { createWithdrawalState } from '@/modules/withdraw/state/WithdrawalState';
import type { CreateWithdrawInput, WithdrawRequest } from '@/modules/withdraw/types';

export class WithdrawService {
  constructor(
    private readonly repository: WithdrawRepository = createWithdrawRepository()
  ) {}

  requestWithdraw(input: CreateWithdrawInput): Promise<WithdrawRequest> {
    if (input.amount <= 0) {
      throw new Error('Informe um valor válido para saque.');
    }

    return this.repository.create(input);
  }

  listAll(): Promise<WithdrawRequest[]> {
    return this.repository.listAll();
  }

  listByUser(userId: string): Promise<WithdrawRequest[]> {
    return this.repository.listByUser(userId);
  }

  async approve(id: string): Promise<WithdrawRequest> {
    const request = await this.findRequest(id);
    return createWithdrawalState(request, this.repository).approve();
  }

  async reject(id: string): Promise<WithdrawRequest> {
    const request = await this.findRequest(id);
    return createWithdrawalState(request, this.repository).reject();
  }

  private async findRequest(id: string): Promise<WithdrawRequest> {
    const request = await this.repository.getById(id);

    if (!request) {
      throw new Error('Solicitação de saque não encontrada.');
    }

    return request;
  }
}
