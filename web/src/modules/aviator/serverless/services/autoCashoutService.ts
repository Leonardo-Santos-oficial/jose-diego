import type { EngineStateRepository } from '@/modules/aviator/serverless/repositories/engineStateRepository';
import type { AviatorRealtimePublisher } from '@/modules/aviator/serverless/publishers/realtimePublisher';
import type { CashoutResultMessage } from '@/types/aviator';

export class AutoCashoutService {
  constructor(
    private readonly repo: EngineStateRepository,
    private readonly publisher: AviatorRealtimePublisher
  ) {}

  async run(roundId: string, multiplier: number): Promise<void> {
    const candidates = await this.repo.listAutoCashoutCandidates(roundId, multiplier);

    for (const candidate of candidates) {
      try {
        const result = await this.repo.performCashout({
          ticketId: candidate.ticketId,
          userId: candidate.userId,
          roundId,
          multiplier,
        });

        const message: CashoutResultMessage = {
          ticketId: result.ticketId,
          status: 'credited',
          creditedAmount: result.creditedAmount,
          cashoutMultiplier: result.payoutMultiplier,
          snapshot: {
            balance: result.balance,
            updatedAt: result.updatedAt,
          },
        };

        await this.publisher.publishCashoutResult(message);
      } catch (error) {
        console.warn('Auto cashout falhou', candidate.ticketId, error);
      }
    }
  }
}
