import type { User } from '@supabase/supabase-js';
import type { BetResultMessage, CashoutResultMessage } from '@/types/aviator';
import {
  createAviatorEngineFacade,
  AviatorEngineFacade,
} from '@/modules/aviator/serverless/AviatorEngineFacade';
import {
  getVpsEngineAdapter,
  type CommandAdapter,
} from '@/modules/aviator/serverless/adapters';
import { getCurrentSession } from '@/lib/auth/session';
import {
  validateBetAmount,
  type BetAmountValidationResult,
} from '@/modules/aviator/validation/validateBetAmount';

const USE_VPS_ENGINE = !!process.env.NEXT_PUBLIC_ENGINE_URL;

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
  adapter?: CommandAdapter;
};

type PlayerCommandServiceOptions = PlayerCommandServiceDeps & {
  session?: User | null;
  getSession?: () => Promise<User | null>;
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
    const userId = session?.id?.trim();

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

    const betInput = {
      userId: this.context.userId,
      roundId: normalizedRoundId,
      amount: Number(payload.amount.toFixed(2)),
      autopayoutMultiplier: parseOptionalNumber(payload.autopayoutMultiplier),
    };

    if (USE_VPS_ENGINE) {
      const adapter = this.deps.adapter ?? getVpsEngineAdapter();
      return adapter.placeBet(betInput);
    }

    const facade = this.resolveFacade();
    return facade.placeBet(betInput);
  }

  async cashout(payload: CashoutPayload): Promise<CashoutResultMessage> {
    const ticketId = payload.ticketId?.trim();
    if (!ticketId) {
      throw new PlayerCommandError(
        'INVALID_CASHOUT',
        'Informe o ticket que deseja encerrar.'
      );
    }

    const cashoutInput = {
      userId: this.context.userId,
      ticketId,
      kind: payload.kind === 'auto' ? 'auto' as const : 'manual' as const,
    };

    if (USE_VPS_ENGINE) {
      const adapter = this.deps.adapter ?? getVpsEngineAdapter();
      return adapter.cashout(cashoutInput);
    }

    const facade = this.resolveFacade();
    return facade.cashout(cashoutInput);
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
    adapter: options.adapter,
  };
}
