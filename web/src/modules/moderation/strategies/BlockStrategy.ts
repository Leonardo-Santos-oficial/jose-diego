import type { ModerationStrategy, ApplyModerationInput } from '../types';

export class BlockStrategy implements ModerationStrategy {
  readonly type = 'block' as const;
  readonly requiresDuration = false;

  validate(input: ApplyModerationInput): void {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error('O motivo do bloqueio deve ter pelo menos 5 caracteres.');
    }
  }

  getExpirationDate(): Date | null {
    return null;
  }
}
