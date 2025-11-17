import type { CashoutResultMessage } from '@/types/aviator';
import type { CashoutInput, EngineState } from '@/modules/aviator/serverless/types';
import type { EngineStateRepository } from '@/modules/aviator/serverless/repositories/engineStateRepository';
import type { AviatorRealtimePublisher } from '@/modules/aviator/serverless/publishers/realtimePublisher';

export class CashoutCommand {
  constructor(
    private readonly repo: EngineStateRepository,
    private readonly publisher: AviatorRealtimePublisher
  ) {}

  async execute(
    input: CashoutInput,
    engineState: EngineState
  ): Promise<CashoutResultMessage> {
    if (engineState.phase !== 'flying') {
      return this.reject(input.ticketId, 'Cashout disponível apenas durante o voo.');
    }

    const ticketInfo = await this.repo.getTicketInfo(input.ticketId);

    if (!ticketInfo) {
      return this.reject(input.ticketId, 'Ticket não encontrado.');
    }

    if (ticketInfo.roundId !== engineState.roundId) {
      return this.reject(input.ticketId, 'Este ticket não pertence ao round atual.');
    }

    if (ticketInfo.userId !== input.userId) {
      return this.reject(input.ticketId, 'Ticket não pertence ao usuário.');
    }

    try {
      const result = await this.repo.performCashout({
        ticketId: input.ticketId,
        userId: input.userId,
        roundId: ticketInfo.roundId,
        multiplier: engineState.currentMultiplier,
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
      return message;
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Falha ao executar cashout.';
      const message = this.reject(input.ticketId, reason);
      await this.publisher.publishCashoutResult(message);
      return message;
    }
  }

  private reject(ticketId: string, reason: string): CashoutResultMessage {
    return {
      ticketId,
      status: 'rejected',
      reason,
      snapshot: {
        balance: 0,
        updatedAt: '1970-01-01T00:00:00.000Z',
      },
    };
  }
}
