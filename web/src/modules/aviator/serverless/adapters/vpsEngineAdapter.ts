import type { BetResultMessage, CashoutResultMessage } from '@/types/aviator';
import type { PlaceBetInput, CashoutInput } from '../types';
import {
  getEngineClient,
  type EngineHttpClient,
} from '@/lib/engine/engineHttpClient';

export interface CommandAdapter {
  placeBet(input: PlaceBetInput): Promise<BetResultMessage>;
  cashout(input: CashoutInput): Promise<CashoutResultMessage>;
}

export class VpsEngineAdapter implements CommandAdapter {
  constructor(private readonly client: EngineHttpClient = getEngineClient()) {}

  async placeBet(input: PlaceBetInput): Promise<BetResultMessage> {
    const response = await this.client.placeBet({
      roundId: input.roundId,
      userId: input.userId,
      amount: input.amount,
      autopayoutMultiplier: input.autopayoutMultiplier,
    });

    return {
      status: response.status,
      ticketId: response.ticketId,
      roundId: response.roundId,
      userId: response.userId,
      reason: response.reason,
      snapshot: response.snapshot ?? {
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async cashout(input: CashoutInput): Promise<CashoutResultMessage> {
    const response = await this.client.cashout({
      ticketId: input.ticketId,
      userId: input.userId,
      kind: input.kind ?? 'manual',
    });

    const status = response.status === 'credited' ? 'credited' : 'rejected';

    return {
      status,
      ticketId: response.ticketId,
      creditedAmount: response.payout,
      cashoutMultiplier: response.multiplier,
      reason: response.reason,
      snapshot: {
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

let adapterInstance: VpsEngineAdapter | null = null;

export function getVpsEngineAdapter(): VpsEngineAdapter {
  if (!adapterInstance) {
    adapterInstance = new VpsEngineAdapter();
  }
  return adapterInstance;
}
