export type ModerationActionType = 'warn' | 'suspend' | 'block' | 'ban';

export type ModerationStatus = 'active' | 'expired' | 'revoked';

export interface ModerationAction {
  id: string;
  userId: string;
  actionType: ModerationActionType;
  reason: string;
  adminId: string;
  adminName: string;
  expiresAt: string | null;
  status: ModerationStatus;
  createdAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
}

export interface UserModerationState {
  userId: string;
  isBanned: boolean;
  isBlocked: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  warningCount: number;
  canChat: boolean;
  activeActions: ModerationAction[];
}

export interface ApplyModerationInput {
  userId: string;
  actionType: ModerationActionType;
  reason: string;
  adminId: string;
  adminName: string;
  durationMinutes?: number;
}

export interface RevokeModerationInput {
  actionId: string;
  adminId: string;
}

export interface ModerationRepository {
  createAction(input: ApplyModerationInput): Promise<ModerationAction>;
  revokeAction(input: RevokeModerationInput): Promise<ModerationAction>;
  getActiveActionsForUser(userId: string): Promise<ModerationAction[]>;
  getActionHistory(userId: string, limit?: number): Promise<ModerationAction[]>;
  getRecentActions(limit?: number): Promise<ModerationAction[]>;
  countActiveWarnings(userId: string): Promise<number>;
}

export interface ModerationStrategy {
  readonly type: ModerationActionType;
  readonly requiresDuration: boolean;
  readonly defaultDurationMinutes?: number;
  validate(input: ApplyModerationInput): void;
  getExpirationDate(durationMinutes?: number): Date | null;
}

export type UserDataPurgeResult = {
  userId: string;
  deleted: {
    globalChatMessages: number;
    chatMessages: number;
    chatThreads: number;
    withdrawRequests: number;
    bets: number;
  };
};

export interface UserDataPurgeRepository {
  purgeUserData(userId: string): Promise<UserDataPurgeResult>;
}

