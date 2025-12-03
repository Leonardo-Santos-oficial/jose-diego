import type { ModerationStrategy, ApplyModerationInput } from '../types';

const DEFAULT_SUSPENSION_MINUTES = 60;
const MAX_SUSPENSION_MINUTES = 43200; // 30 days

export class SuspendStrategy implements ModerationStrategy {
  readonly type = 'suspend' as const;
  readonly requiresDuration = true;
  readonly defaultDurationMinutes = DEFAULT_SUSPENSION_MINUTES;

  validate(input: ApplyModerationInput): void {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error('O motivo da suspensão deve ter pelo menos 5 caracteres.');
    }

    const duration = input.durationMinutes ?? DEFAULT_SUSPENSION_MINUTES;

    if (duration < 1) {
      throw new Error('A duração da suspensão deve ser de pelo menos 1 minuto.');
    }

    if (duration > MAX_SUSPENSION_MINUTES) {
      throw new Error('A suspensão máxima é de 30 dias.');
    }
  }

  getExpirationDate(durationMinutes?: number): Date {
    const duration = durationMinutes ?? DEFAULT_SUSPENSION_MINUTES;
    return new Date(Date.now() + duration * 60 * 1000);
  }
}
