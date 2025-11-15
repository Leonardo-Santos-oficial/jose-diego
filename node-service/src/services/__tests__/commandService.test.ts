import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CommandService } from '../commandService.js';
import type { GameStateSnapshot } from '../../loop/types.js';
import type { RealtimePublisher } from '../../publisher/realtimePublisher.js';

const baseState: GameStateSnapshot = {
  roundId: 'round-42',
  phase: 'flying',
  multiplier: 2.5,
  phaseStartedAt: new Date('2024-01-01T00:00:00.000Z')
};

const createPublisherMock = (): RealtimePublisher => ({
  publishState: vi.fn(),
  publishHistory: vi.fn(),
  publishBetResult: vi.fn(),
  publishCashoutResult: vi.fn()
});

type WalletRow = { balance: number; updated_at: string } | null;

type SupabaseStubOptions = {
  rpcResponse: unknown;
  walletRow?: WalletRow;
};

const buildSupabaseStub = ({ rpcResponse, walletRow }: SupabaseStubOptions) => {
  const resolvedWallet = walletRow ?? { balance: 200, updated_at: '2024-01-02T00:00:00.000Z' };
  const walletQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolvedWallet })
  };

  const supabase = {
    rpc: vi.fn().mockResolvedValue(rpcResponse),
    from: vi.fn().mockReturnValue(walletQuery)
  };

  return {
    supabase: supabase as unknown as SupabaseClient,
    rpcMock: supabase.rpc as ReturnType<typeof vi.fn>,
    walletQuery
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CommandService', () => {
  it('publishes bet result when RPC succeeds', async () => {
    const rpcResponse = {
      data: {
        ticket_id: 'ticket-1',
        balance: 370,
        updated_at: '2024-01-02T10:00:00.000Z'
      },
      error: null
    };
    const { supabase, rpcMock } = buildSupabaseStub({ rpcResponse });
    const publisher = createPublisherMock();
    const service = new CommandService(supabase, () => baseState, publisher);

    const result = await service.placeBet({ roundId: 'round-42', userId: 'user-1', amount: 30 });

    expect(result).toEqual({
      roundId: 'round-42',
      userId: 'user-1',
      status: 'accepted',
      ticketId: 'ticket-1',
      snapshot: {
        balance: 370,
        updatedAt: '2024-01-02T10:00:00.000Z'
      }
    });
    expect(publisher.publishBetResult).toHaveBeenCalledWith(result);
    expect(rpcMock).toHaveBeenCalledWith('perform_bet', {
      p_round_id: 'round-42',
      p_user_id: 'user-1',
      p_amount: 30,
      p_autocashout: null
    });
  });

  it('returns rejection with snapshot when perform_bet fails', async () => {
    const rpcResponse = { data: null, error: { message: 'INSUFFICIENT_FUNDS' } };
    const walletRow = { balance: 80, updated_at: '2024-01-03T12:45:00.000Z' };
    const { supabase } = buildSupabaseStub({ rpcResponse, walletRow });
    const publisher = createPublisherMock();
    const service = new CommandService(supabase, () => baseState, publisher);

    const result = await service.placeBet({ roundId: 'round-42', userId: 'user-2', amount: 150 });

    expect(result).toEqual({
      roundId: 'round-42',
      userId: 'user-2',
      status: 'rejected',
      reason: 'INSUFFICIENT_FUNDS',
      snapshot: {
        balance: 80,
        updatedAt: '2024-01-03T12:45:00.000Z'
      }
    });
    expect(publisher.publishBetResult).not.toHaveBeenCalled();
  });

  it('publishes cashout result with credited amount when RPC succeeds', async () => {
    const rpcResponse = {
      data: {
        ticket_id: 'ticket-42',
        credited_amount: 75,
        payout_multiplier: 3,
        balance: 275,
        updated_at: '2024-01-05T08:00:00.000Z'
      },
      error: null
    };
    const { supabase, rpcMock } = buildSupabaseStub({ rpcResponse });
    const publisher = createPublisherMock();
    const service = new CommandService(supabase, () => baseState, publisher);

    const result = await service.cashout({ ticketId: 'ticket-42', userId: 'user-3', kind: 'manual' });

    expect(result).toEqual({
      ticketId: 'ticket-42',
      status: 'credited',
      creditedAmount: 75,
      cashoutMultiplier: 3,
      snapshot: {
        balance: 275,
        updatedAt: '2024-01-05T08:00:00.000Z'
      }
    });
    expect(publisher.publishCashoutResult).toHaveBeenCalledWith(result);
    expect(rpcMock).toHaveBeenCalledWith('perform_cashout', {
      p_ticket_id: 'ticket-42',
      p_user_id: 'user-3',
      p_round_id: baseState.roundId,
      p_multiplier: baseState.multiplier
    });
  });

  it('publishes rejection with wallet snapshot when perform_cashout fails', async () => {
    const rpcResponse = { data: null, error: { message: 'BET_NOT_FOUND' } };
    const walletRow = { balance: 190, updated_at: '2024-01-06T09:30:00.000Z' };
    const { supabase } = buildSupabaseStub({ rpcResponse, walletRow });
    const publisher = createPublisherMock();
    const service = new CommandService(supabase, () => baseState, publisher);

    const result = await service.cashout({ ticketId: 'ticket-missing', userId: 'user-4', kind: 'manual' });

    expect(result).toEqual({
      ticketId: 'ticket-missing',
      status: 'rejected',
      reason: 'BET_NOT_FOUND',
      snapshot: {
        balance: 190,
        updatedAt: '2024-01-06T09:30:00.000Z'
      }
    });
    expect(publisher.publishCashoutResult).toHaveBeenCalledWith(result);
  });
});
