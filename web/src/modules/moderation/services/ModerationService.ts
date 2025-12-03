import type {
  ModerationAction,
  ModerationRepository,
  UserModerationState,
  ApplyModerationInput,
  RevokeModerationInput,
} from '../types';
import { ApplyModerationCommand } from '../commands/ApplyModerationCommand';
import { RevokeModerationCommand } from '../commands/RevokeModerationCommand';
import { SupabaseModerationRepository } from '../repositories/SupabaseModerationRepository';

export class ModerationService {
  private readonly repository: ModerationRepository;
  private readonly applyCommand: ApplyModerationCommand;
  private readonly revokeCommand: RevokeModerationCommand;

  constructor(repository?: ModerationRepository) {
    this.repository = repository ?? new SupabaseModerationRepository();
    this.applyCommand = new ApplyModerationCommand(this.repository);
    this.revokeCommand = new RevokeModerationCommand(this.repository);
  }

  async applyAction(input: ApplyModerationInput): Promise<ModerationAction> {
    return this.applyCommand.execute(input);
  }

  async revokeAction(input: RevokeModerationInput): Promise<ModerationAction> {
    return this.revokeCommand.execute(input);
  }

  async getUserModerationState(userId: string): Promise<UserModerationState> {
    const activeActions = await this.repository.getActiveActionsForUser(userId);
    const warningCount = await this.repository.countActiveWarnings(userId);

    const now = new Date();

    const isBanned = activeActions.some((a) => a.actionType === 'ban');
    const isBlocked = activeActions.some((a) => a.actionType === 'block');

    const suspendAction = activeActions.find((a) => {
      if (a.actionType !== 'suspend') return false;
      if (!a.expiresAt) return false;
      return new Date(a.expiresAt) > now;
    });

    const isSuspended = !!suspendAction;
    const suspendedUntil = suspendAction?.expiresAt ?? null;

    const canChat = !isBanned && !isBlocked && !isSuspended;

    return {
      userId,
      isBanned,
      isBlocked,
      isSuspended,
      suspendedUntil,
      warningCount,
      canChat,
      activeActions,
    };
  }

  async getUserActionHistory(userId: string, limit?: number): Promise<ModerationAction[]> {
    return this.repository.getActionHistory(userId, limit);
  }

  async getRecentActions(limit?: number): Promise<ModerationAction[]> {
    return this.repository.getRecentActions(limit);
  }

  async canUserChat(userId: string): Promise<boolean> {
    const state = await this.getUserModerationState(userId);
    return state.canChat;
  }
}
