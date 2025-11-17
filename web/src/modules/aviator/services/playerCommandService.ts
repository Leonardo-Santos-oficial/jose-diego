import type { Session } from '@supabase/supabase-js';
import type { BetResultMessage, CashoutResultMessage } from '@/types/aviator';
import {
  createAviatorEngineFacade,
  AviatorEngineFacade,
} from '@/modules/aviator/serverless/AviatorEngineFacade';
import { getCurrentSession } from '@/lib/auth/session';
import {
  validateBetAmount,
  type BetAmountValidationResult,
} from '@/modules/aviator/validation/validateBetAmount';

type PlaceBetPayload = {
  roundId: string;
  amount: number;
  autopayoutMultiplier?: number;
};

type CashoutPayload = {
  ticketId: string;
  kind?: 'manual' | 'auto';
};

type PlayerCommandServiceDeps = {
  createFacade?: () => AviatorEngineFacade;
};

type PlayerCommandServiceOptions = PlayerCommandServiceDeps & {
  session?: Session | null;
  getSession?: () => Promise<Session | null>;
};

type PlayerCommandContext = {
  userId: string;
};

export type PlayerCommandErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_ROUND'
  | 'INVALID_BET'
  | 'INVALID_CASHOUT';

export class PlayerCommandError extends Error {
  constructor(
    public readonly code: PlayerCommandErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'PlayerCommandError';
  }
}

export class PlayerCommandService {
  private constructor(
    private readonly context: PlayerCommandContext,
    private readonly deps: PlayerCommandServiceDeps = {}
  ) {}

  static async forCurrentUser(
    options: PlayerCommandServiceOptions = {}
  ): Promise<PlayerCommandService> {
    const session =
      options.session ?? (await (options.getSession ?? getCurrentSession)());
    const userId = session?.user?.id?.trim();

    if (!userId) {
      throw new PlayerCommandError('UNAUTHENTICATED', 'Faça login para enviar comandos.');
    }

    return new PlayerCommandService({ userId }, pickDeps(options));
  }

  static forUser(
    userId: string,
    options: PlayerCommandServiceDeps = {}
  ): PlayerCommandService {
    const normalized = userId?.trim();

    if (!normalized) {
      throw new PlayerCommandError('UNAUTHENTICATED', 'Usuário de referência inválido.');
    }

    return new PlayerCommandService({ userId: normalized }, options);
  }

  async placeBet(payload: PlaceBetPayload): Promise<BetResultMessage> {
    const normalizedRoundId = payload.roundId?.trim();

    if (!normalizedRoundId) {
      throw new PlayerCommandError(
        'INVALID_ROUND',
        'Round atual indisponível. Tente novamente.'
      );
    }

    const validation = validateBetAmount(payload.amount);
    assertValidAmount(validation);

    const facade = this.resolveFacade();

    return facade.placeBet({
      userId: this.context.userId,
      roundId: normalizedRoundId,
      amount: Number(payload.amount.toFixed(2)),
      autopayoutMultiplier: parseOptionalNumber(payload.autopayoutMultiplier),
    });
  }

  async cashout(payload: CashoutPayload): Promise<CashoutResultMessage> {
    const ticketId = payload.ticketId?.trim();
    if (!ticketId) {
      throw new PlayerCommandError(
        'INVALID_CASHOUT',
        'Informe o ticket que deseja encerrar.'
      );
    }

    const facade = this.resolveFacade();
    return facade.cashout({
      userId: this.context.userId,
      ticketId,
      kind: payload.kind === 'auto' ? 'auto' : 'manual',
    });
  }

  private resolveFacade(): AviatorEngineFacade {
    return (this.deps.createFacade ?? createAviatorEngineFacade)();
  }
}

function assertValidAmount(
  validation: BetAmountValidationResult
): asserts validation is { ok: true } {
  if (!validation.ok) {
    throw new PlayerCommandError('INVALID_BET', validation.message);
  }
}

function parseOptionalNumber(value?: number): number | undefined {
  if (typeof value !== 'number') {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function pickDeps(options: PlayerCommandServiceOptions): PlayerCommandServiceDeps {
  return {
    createFacade: options.createFacade,
  };
}
