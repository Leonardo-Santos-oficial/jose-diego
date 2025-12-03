import type { ModerationStrategy, ApplyModerationInput } from '../types';

export class WarnStrategy implements ModerationStrategy {
  readonly type = 'warn' as const;
  readonly requiresDuration = false;

  validate(input: ApplyModerationInput): void {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error('O motivo da advertência deve ter pelo menos 5 caracteres.');
    }
  }

  getExpirationDate(): Date | null {
    return null;
  }
}
