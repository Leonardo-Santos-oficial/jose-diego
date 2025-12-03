import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModerationService } from '../services/ModerationService';
import type {
  ModerationAction,
  ModerationRepository,
  ApplyModerationInput,
  RevokeModerationInput,
} from '../types';

// Mock repository
function createMockRepository(): ModerationRepository {
  return {
    createAction: vi.fn(),
    revokeAction: vi.fn(),
    getActiveActionsForUser: vi.fn(),
    getActionHistory: vi.fn(),
    getRecentActions: vi.fn(),
    countActiveWarnings: vi.fn(),
  };
}

function createMockAction(overrides: Partial<ModerationAction> = {}): ModerationAction {
  return {
    id: 'action-1',
    userId: 'user-1',
    actionType: 'warn',
    reason: 'Test reason for the action',
    adminId: 'admin-1',
    adminName: 'Admin Test',
    expiresAt: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    revokedAt: null,
    revokedBy: null,
    ...overrides,
  };
}

describe('ModerationService', () => {
  let service: ModerationService;
  let mockRepo: ModerationRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new ModerationService(mockRepo);
  });

  describe('applyAction', () => {
    it('should create action via command', async () => {
      const expectedAction = createMockAction();
      vi.mocked(mockRepo.createAction).mockResolvedValue(expectedAction);

      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'warn',
        reason: 'Test reason for the action',
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      const result = await service.applyAction(input);

      expect(mockRepo.createAction).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedAction);
    });

    it('should validate input via strategy', async () => {
      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'warn',
        reason: 'abc', // Too short
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      await expect(service.applyAction(input)).rejects.toThrow(
        'O motivo da advertência deve ter pelo menos 5 caracteres.'
      );
    });
  });

  describe('revokeAction', () => {
    it('should revoke action via command', async () => {
      const expectedAction = createMockAction({ status: 'revoked' });
      vi.mocked(mockRepo.revokeAction).mockResolvedValue(expectedAction);

      const input: RevokeModerationInput = {
        actionId: 'action-1',
        adminId: 'admin-2',
      };

      const result = await service.revokeAction(input);

      expect(mockRepo.revokeAction).toHaveBeenCalledWith(input);
      expect(result.status).toBe('revoked');
    });
  });

  describe('getUserModerationState', () => {
    it('should return clean state when no active actions', async () => {
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const state = await service.getUserModerationState('user-1');

      expect(state.userId).toBe('user-1');
      expect(state.isBanned).toBe(false);
      expect(state.isBlocked).toBe(false);
      expect(state.isSuspended).toBe(false);
      expect(state.suspendedUntil).toBeNull();
      expect(state.warningCount).toBe(0);
      expect(state.canChat).toBe(true);
      expect(state.activeActions).toEqual([]);
    });

    it('should detect banned user', async () => {
      const banAction = createMockAction({ actionType: 'ban' });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([banAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const state = await service.getUserModerationState('user-1');

      expect(state.isBanned).toBe(true);
      expect(state.canChat).toBe(false);
    });

    it('should detect blocked user', async () => {
      const blockAction = createMockAction({ actionType: 'block' });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([blockAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const state = await service.getUserModerationState('user-1');

      expect(state.isBlocked).toBe(true);
      expect(state.canChat).toBe(false);
    });

    it('should detect suspended user with valid expiration', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const suspendAction = createMockAction({
        actionType: 'suspend',
        expiresAt: futureDate,
      });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([suspendAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const state = await service.getUserModerationState('user-1');

      expect(state.isSuspended).toBe(true);
      expect(state.suspendedUntil).toBe(futureDate);
      expect(state.canChat).toBe(false);
    });

    it('should not consider expired suspension as active', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const suspendAction = createMockAction({
        actionType: 'suspend',
        expiresAt: pastDate,
      });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([suspendAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const state = await service.getUserModerationState('user-1');

      expect(state.isSuspended).toBe(false);
      expect(state.suspendedUntil).toBeNull();
      expect(state.canChat).toBe(true);
    });

    it('should count warnings correctly', async () => {
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(3);

      const state = await service.getUserModerationState('user-1');

      expect(state.warningCount).toBe(3);
      expect(state.canChat).toBe(true); // Warnings don't block chat
    });
  });

  describe('getUserActionHistory', () => {
    it('should return action history from repository', async () => {
      const actions = [
        createMockAction({ id: 'action-1' }),
        createMockAction({ id: 'action-2', status: 'revoked' }),
      ];
      vi.mocked(mockRepo.getActionHistory).mockResolvedValue(actions);

      const result = await service.getUserActionHistory('user-1', 50);

      expect(mockRepo.getActionHistory).toHaveBeenCalledWith('user-1', 50);
      expect(result).toEqual(actions);
    });
  });

  describe('getRecentActions', () => {
    it('should return recent actions from repository', async () => {
      const actions = [
        createMockAction({ id: 'action-1' }),
        createMockAction({ id: 'action-2' }),
      ];
      vi.mocked(mockRepo.getRecentActions).mockResolvedValue(actions);

      const result = await service.getRecentActions(100);

      expect(mockRepo.getRecentActions).toHaveBeenCalledWith(100);
      expect(result).toEqual(actions);
    });
  });

  describe('canUserChat', () => {
    it('should return true when user has no restrictions', async () => {
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const result = await service.canUserChat('user-1');

      expect(result).toBe(true);
    });

    it('should return false when user is banned', async () => {
      const banAction = createMockAction({ actionType: 'ban' });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([banAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const result = await service.canUserChat('user-1');

      expect(result).toBe(false);
    });

    it('should return false when user is blocked', async () => {
      const blockAction = createMockAction({ actionType: 'block' });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([blockAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const result = await service.canUserChat('user-1');

      expect(result).toBe(false);
    });

    it('should return false when user is suspended', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const suspendAction = createMockAction({
        actionType: 'suspend',
        expiresAt: futureDate,
      });
      vi.mocked(mockRepo.getActiveActionsForUser).mockResolvedValue([suspendAction]);
      vi.mocked(mockRepo.countActiveWarnings).mockResolvedValue(0);

      const result = await service.canUserChat('user-1');

      expect(result).toBe(false);
    });
  });
});
