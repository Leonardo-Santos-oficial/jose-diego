import type {
  ModerationAction,
  ModerationRepository,
  ApplyModerationInput,
} from '../types';
import { getStrategy } from '../strategies/strategyFactory';

export class ApplyModerationCommand {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(input: ApplyModerationInput): Promise<ModerationAction> {
    const strategy = getStrategy(input.actionType);

    strategy.validate(input);

    return this.repository.createAction(input);
  }
}
