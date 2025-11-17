import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import {
  PlayerCommandService,
  PlayerCommandError,
} from '@/modules/aviator/services/playerCommandService';
import type { BetResultMessage, CashoutResultMessage } from '@/types/aviator';

const placeBetMock = vi.fn<
  [{ userId: string; roundId: string; amount: number; autopayoutMultiplier?: number }],
  Promise<BetResultMessage>
>();
const cashoutMock = vi.fn<
  [{ userId: string; ticketId: string; kind?: 'manual' | 'auto' }],
  Promise<CashoutResultMessage>
>();

vi.mock('@/modules/aviator/serverless/AviatorEngineFacade', () => ({
  createAviatorEngineFacade: () => ({
    placeBet: placeBetMock,
    cashout: cashoutMock,
  }),
  AviatorEngineFacade: class {},
}));

const getCurrentSessionMock = vi.fn<[], Promise<Session | null>>();
vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: () => getCurrentSessionMock(),
}));

describe('PlayerCommandService', () => {
  beforeEach(() => {
    placeBetMock.mockReset();
    cashoutMock.mockReset();
    getCurrentSessionMock.mockReset();
  });

  it('recusa criar instância sem sessão', async () => {
    getCurrentSessionMock.mockResolvedValue(null);
    await expect(PlayerCommandService.forCurrentUser()).rejects.toThrow(
      PlayerCommandError
    );
  });

  it('usa o userId da sessão ao enviar apostas', async () => {
    getCurrentSessionMock.mockResolvedValue({
      user: { id: 'user-123' },
    } as Session);

    const service = await PlayerCommandService.forCurrentUser();
    placeBetMock.mockResolvedValue({
      status: 'accepted',
      roundId: 'round-1',
      userId: 'user-123',
      ticketId: 'ticket-1',
      snapshot: { balance: 0, updatedAt: new Date().toISOString() },
    });

    await service.placeBet({ roundId: 'round-1', amount: 50 });

    expect(placeBetMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123', roundId: 'round-1', amount: 50 })
    );
  });
});
