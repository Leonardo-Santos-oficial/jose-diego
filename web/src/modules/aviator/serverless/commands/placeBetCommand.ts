import type { BetResultMessage } from '@/types/aviator';
import type { EngineState, PlaceBetInput } from '@/modules/aviator/serverless/types';
import type { EngineStateRepository } from '@/modules/aviator/serverless/repositories/engineStateRepository';
import type { AviatorRealtimePublisher } from '@/modules/aviator/serverless/publishers/realtimePublisher';

const MIN_BET = 0.5;
const MAX_BET = 500;
const MIN_AUTOPAYOUT = 1;
const MAX_AUTOPAYOUT = 100;

export class PlaceBetCommand {
  constructor(
    private readonly repo: EngineStateRepository,
    private readonly publisher: AviatorRealtimePublisher
  ) {}

  async execute(
    input: PlaceBetInput,
    engineState: EngineState
  ): Promise<BetResultMessage> {
    if (engineState.phase !== 'awaitingBets') {
      return this.reject(
        engineState.roundId,
        input.userId,
        'Apostas permitidas apenas antes da decolagem.'
      );
    }

    if (engineState.roundId !== input.roundId) {
      return this.reject(
        engineState.roundId,
        input.userId,
        'O round informado não está mais ativo.'
      );
    }

    if (input.amount < MIN_BET || input.amount > MAX_BET) {
      return this.reject(
        engineState.roundId,
        input.userId,
        `Valor deve estar entre R$ ${MIN_BET.toFixed(2)} e R$ ${MAX_BET.toFixed(2)}.`
      );
    }

    if (
      input.autopayoutMultiplier &&
      (input.autopayoutMultiplier < MIN_AUTOPAYOUT ||
        input.autopayoutMultiplier > MAX_AUTOPAYOUT)
    ) {
      return this.reject(
        engineState.roundId,
        input.userId,
        'Auto cashout fora do intervalo permitido.'
      );
    }

    try {
      const result = await this.repo.performBet({
        roundId: engineState.roundId,
        userId: input.userId,
        amount: input.amount,
        autopayoutMultiplier: input.autopayoutMultiplier,
      });

      const message: BetResultMessage = {
        roundId: engineState.roundId,
        userId: input.userId,
        status: 'accepted',
        ticketId: result.ticketId,
        snapshot: {
          balance: Number(result.balance ?? 0),
          updatedAt: result.updatedAt,
        },
      };

      await this.publisher.publishBetResult(message);
      return message;
    } catch (error) {
      const reason = sanitizeError(error);
      const message = this.reject(engineState.roundId, input.userId, reason);
      await this.publisher.publishBetResult(message);
      return message;
    }
  }

  private reject(roundId: string, userId: string, reason: string): BetResultMessage {
    return {
      roundId,
      userId,
      status: 'rejected',
      reason,
      snapshot: {
        balance: 0,
        updatedAt: '1970-01-01T00:00:00.000Z',
      },
    };
  }
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Aposta rejeitada. Tente novamente.';
}
