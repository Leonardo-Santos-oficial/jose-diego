import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModerationAction, ModerationActionType } from '../types';

describe('Moderation Types', () => {
  describe('ModerationAction', () => {
    it('should have all required properties', () => {
      const action: ModerationAction = {
        id: 'action-1',
        userId: 'user-1',
        actionType: 'warn',
        reason: 'Test reason',
        adminId: 'admin-1',
        adminName: 'Admin Test',
        expiresAt: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        revokedAt: null,
        revokedBy: null,
      };

      expect(action.id).toBe('action-1');
      expect(action.userId).toBe('user-1');
      expect(action.actionType).toBe('warn');
      expect(action.reason).toBe('Test reason');
      expect(action.adminId).toBe('admin-1');
      expect(action.adminName).toBe('Admin Test');
      expect(action.status).toBe('active');
    });

    it('should support all action types', () => {
      const actionTypes: ModerationActionType[] = ['warn', 'suspend', 'block', 'ban'];

      actionTypes.forEach((type) => {
        const action: ModerationAction = {
          id: `action-${type}`,
          userId: 'user-1',
          actionType: type,
          reason: 'Test reason',
          adminId: 'admin-1',
          adminName: 'Admin Test',
          expiresAt: null,
          status: 'active',
          createdAt: new Date().toISOString(),
          revokedAt: null,
          revokedBy: null,
        };

        expect(action.actionType).toBe(type);
      });
    });

    it('should support all status types', () => {
      const statuses: ModerationAction['status'][] = ['active', 'expired', 'revoked'];

      statuses.forEach((status) => {
        const action: ModerationAction = {
          id: 'action-1',
          userId: 'user-1',
          actionType: 'warn',
          reason: 'Test reason',
          adminId: 'admin-1',
          adminName: 'Admin Test',
          expiresAt: null,
          status,
          createdAt: new Date().toISOString(),
          revokedAt: status === 'revoked' ? new Date().toISOString() : null,
          revokedBy: status === 'revoked' ? 'admin-2' : null,
        };

        expect(action.status).toBe(status);
      });
    });

    it('should support expiresAt for suspensions', () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const action: ModerationAction = {
        id: 'action-1',
        userId: 'user-1',
        actionType: 'suspend',
        reason: 'Suspension test',
        adminId: 'admin-1',
        adminName: 'Admin Test',
        expiresAt,
        status: 'active',
        createdAt: new Date().toISOString(),
        revokedAt: null,
        revokedBy: null,
      };

      expect(action.expiresAt).toBe(expiresAt);
    });

    it('should track revocation details', () => {
      const revokedAt = new Date().toISOString();

      const action: ModerationAction = {
        id: 'action-1',
        userId: 'user-1',
        actionType: 'warn',
        reason: 'Revoked test',
        adminId: 'admin-1',
        adminName: 'Admin Test',
        expiresAt: null,
        status: 'revoked',
        createdAt: new Date().toISOString(),
        revokedAt,
        revokedBy: 'admin-2',
      };

      expect(action.status).toBe('revoked');
      expect(action.revokedAt).toBe(revokedAt);
      expect(action.revokedBy).toBe('admin-2');
    });
  });
});
