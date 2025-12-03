import type { ModerationStrategy, ApplyModerationInput } from '../types';

export class BanStrategy implements ModerationStrategy {
  readonly type = 'ban' as const;
  readonly requiresDuration = false;

  validate(input: ApplyModerationInput): void {
    if (!input.reason || input.reason.trim().length < 10) {
      throw new Error('O motivo do banimento deve ter pelo menos 10 caracteres.');
    }
  }

  getExpirationDate(): Date | null {
    return null;
  }
}
