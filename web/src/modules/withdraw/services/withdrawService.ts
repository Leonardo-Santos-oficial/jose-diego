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

  async listAll(): Promise<WithdrawRequest[]> {
    const requests = await this.repository.listAll();
    return this.enrichWithUserEmails(requests);
  }

  private async enrichWithUserEmails(requests: WithdrawRequest[]): Promise<WithdrawRequest[]> {
    const { getSupabaseServiceRoleClient } = await import('@/lib/supabase/serviceRoleClient');
    const supabase = getSupabaseServiceRoleClient();

    const userIds = Array.from(new Set(requests.map((r) => r.userId)));
    const userMap = new Map<string, string>();

    await Promise.all(
      userIds.map(async (uid) => {
        const { data } = await supabase.auth.admin.getUserById(uid);
        if (data.user?.email) {
          userMap.set(uid, data.user.email);
        }
      })
    );

    return requests.map((req) => ({
      ...req,
      userEmail: userMap.get(req.userId) ?? 'Desconhecido',
    }));
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
