import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplyModerationCommand } from '../commands/ApplyModerationCommand';
import { RevokeModerationCommand } from '../commands/RevokeModerationCommand';
import type {
  ModerationAction,
  ModerationRepository,
  ApplyModerationInput,
  RevokeModerationInput,
} from '../types';

// Mock repository factory
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

describe('Moderation Commands', () => {
  describe('ApplyModerationCommand', () => {
    let command: ApplyModerationCommand;
    let mockRepo: ModerationRepository;

    beforeEach(() => {
      mockRepo = createMockRepository();
      command = new ApplyModerationCommand(mockRepo);
    });

    it('should validate and create warn action', async () => {
      const expectedAction = createMockAction();
      vi.mocked(mockRepo.createAction).mockResolvedValue(expectedAction);

      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'warn',
        reason: 'Valid reason for warning',
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      const result = await command.execute(input);

      expect(mockRepo.createAction).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedAction);
    });

    it('should validate and create suspend action with duration', async () => {
      const expectedAction = createMockAction({ actionType: 'suspend' });
      vi.mocked(mockRepo.createAction).mockResolvedValue(expectedAction);

      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'suspend',
        reason: 'Valid reason for suspension',
        adminId: 'admin-1',
        adminName: 'Admin Test',
        durationMinutes: 60,
      };

      const result = await command.execute(input);

      expect(mockRepo.createAction).toHaveBeenCalledWith(input);
      expect(result.actionType).toBe('suspend');
    });

    it('should reject warn with short reason', async () => {
      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'warn',
        reason: 'abc',
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      await expect(command.execute(input)).rejects.toThrow(
        'O motivo da advertência deve ter pelo menos 5 caracteres.'
      );
      expect(mockRepo.createAction).not.toHaveBeenCalled();
    });

    it('should reject suspend with invalid duration', async () => {
      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'suspend',
        reason: 'Valid reason',
        adminId: 'admin-1',
        adminName: 'Admin Test',
        durationMinutes: 0,
      };

      await expect(command.execute(input)).rejects.toThrow(
        'A duração da suspensão deve ser de pelo menos 1 minuto.'
      );
      expect(mockRepo.createAction).not.toHaveBeenCalled();
    });

    it('should reject ban with short reason', async () => {
      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'ban',
        reason: 'short',
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      await expect(command.execute(input)).rejects.toThrow(
        'O motivo do banimento deve ter pelo menos 10 caracteres.'
      );
      expect(mockRepo.createAction).not.toHaveBeenCalled();
    });

    it('should create block action', async () => {
      const expectedAction = createMockAction({ actionType: 'block' });
      vi.mocked(mockRepo.createAction).mockResolvedValue(expectedAction);

      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'block',
        reason: 'Valid reason for blocking',
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      const result = await command.execute(input);

      expect(mockRepo.createAction).toHaveBeenCalledWith(input);
      expect(result.actionType).toBe('block');
    });

    it('should create ban action', async () => {
      const expectedAction = createMockAction({ actionType: 'ban' });
      vi.mocked(mockRepo.createAction).mockResolvedValue(expectedAction);

      const input: ApplyModerationInput = {
        userId: 'user-1',
        actionType: 'ban',
        reason: 'Valid reason for banning the user',
        adminId: 'admin-1',
        adminName: 'Admin Test',
      };

      const result = await command.execute(input);

      expect(mockRepo.createAction).toHaveBeenCalledWith(input);
      expect(result.actionType).toBe('ban');
    });
  });

  describe('RevokeModerationCommand', () => {
    let command: RevokeModerationCommand;
    let mockRepo: ModerationRepository;

    beforeEach(() => {
      mockRepo = createMockRepository();
      command = new RevokeModerationCommand(mockRepo);
    });

    it('should revoke action successfully', async () => {
      const revokedAction = createMockAction({
        status: 'revoked',
        revokedAt: new Date().toISOString(),
        revokedBy: 'admin-2',
      });
      vi.mocked(mockRepo.revokeAction).mockResolvedValue(revokedAction);

      const input: RevokeModerationInput = {
        actionId: 'action-1',
        adminId: 'admin-2',
      };

      const result = await command.execute(input);

      expect(mockRepo.revokeAction).toHaveBeenCalledWith(input);
      expect(result.status).toBe('revoked');
      expect(result.revokedBy).toBe('admin-2');
    });

    it('should reject missing action ID', async () => {
      const input: RevokeModerationInput = {
        actionId: '',
        adminId: 'admin-2',
      };

      await expect(command.execute(input)).rejects.toThrow('ID da ação é obrigatório.');
      expect(mockRepo.revokeAction).not.toHaveBeenCalled();
    });

    it('should reject missing admin ID', async () => {
      const input: RevokeModerationInput = {
        actionId: 'action-1',
        adminId: '',
      };

      await expect(command.execute(input)).rejects.toThrow(
        'ID do administrador é obrigatório.'
      );
      expect(mockRepo.revokeAction).not.toHaveBeenCalled();
    });
  });
});
