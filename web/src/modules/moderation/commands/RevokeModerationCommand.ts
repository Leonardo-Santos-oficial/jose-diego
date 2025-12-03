import type {
  ModerationAction,
  ModerationRepository,
  RevokeModerationInput,
} from '../types';

export class RevokeModerationCommand {
  constructor(private readonly repository: ModerationRepository) {}

  async execute(input: RevokeModerationInput): Promise<ModerationAction> {
    if (!input.actionId) {
      throw new Error('ID da ação é obrigatório.');
    }

    if (!input.adminId) {
      throw new Error('ID do administrador é obrigatório.');
    }

    return this.repository.revokeAction(input);
  }
}
