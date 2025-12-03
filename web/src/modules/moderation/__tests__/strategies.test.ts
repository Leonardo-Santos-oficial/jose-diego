import { describe, it, expect } from 'vitest';
import { WarnStrategy } from '../strategies/WarnStrategy';
import { SuspendStrategy } from '../strategies/SuspendStrategy';
import { BlockStrategy } from '../strategies/BlockStrategy';
import { BanStrategy } from '../strategies/BanStrategy';
import { getStrategy } from '../strategies/strategyFactory';
import type { ApplyModerationInput } from '../types';

describe('Moderation Strategies', () => {
  const baseInput: ApplyModerationInput = {
    userId: 'user-123',
    actionType: 'warn',
    reason: 'Teste de moderação',
    adminId: 'admin-1',
    adminName: 'Admin Test',
  };

  describe('WarnStrategy', () => {
    const strategy = new WarnStrategy();

    it('should have correct type', () => {
      expect(strategy.type).toBe('warn');
    });

    it('should not require duration', () => {
      expect(strategy.requiresDuration).toBe(false);
    });

    it('should validate reason with minimum length', () => {
      expect(() => strategy.validate({ ...baseInput, reason: 'abc' })).toThrow(
        'O motivo da advertência deve ter pelo menos 5 caracteres.'
      );
    });

    it('should accept valid reason', () => {
      expect(() => strategy.validate({ ...baseInput, reason: 'Motivo válido' })).not.toThrow();
    });

    it('should return null for expiration date', () => {
      expect(strategy.getExpirationDate()).toBeNull();
    });
  });

  describe('SuspendStrategy', () => {
    const strategy = new SuspendStrategy();

    it('should have correct type', () => {
      expect(strategy.type).toBe('suspend');
    });

    it('should require duration', () => {
      expect(strategy.requiresDuration).toBe(true);
    });

    it('should have default duration of 60 minutes', () => {
      expect(strategy.defaultDurationMinutes).toBe(60);
    });

    it('should validate reason with minimum length', () => {
      expect(() =>
        strategy.validate({ ...baseInput, actionType: 'suspend', reason: 'abc' })
      ).toThrow('O motivo da suspensão deve ter pelo menos 5 caracteres.');
    });

    it('should reject duration less than 1 minute', () => {
      expect(() =>
        strategy.validate({
          ...baseInput,
          actionType: 'suspend',
          reason: 'Motivo válido',
          durationMinutes: 0,
        })
      ).toThrow('A duração da suspensão deve ser de pelo menos 1 minuto.');
    });

    it('should reject duration more than 30 days', () => {
      expect(() =>
        strategy.validate({
          ...baseInput,
          actionType: 'suspend',
          reason: 'Motivo válido',
          durationMinutes: 50000, // > 43200 (30 days)
        })
      ).toThrow('A suspensão máxima é de 30 dias.');
    });

    it('should accept valid duration', () => {
      expect(() =>
        strategy.validate({
          ...baseInput,
          actionType: 'suspend',
          reason: 'Motivo válido',
          durationMinutes: 60,
        })
      ).not.toThrow();
    });

    it('should return correct expiration date', () => {
      const before = Date.now();
      const expirationDate = strategy.getExpirationDate(60);
      const after = Date.now();

      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate!.getTime()).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
      expect(expirationDate!.getTime()).toBeLessThanOrEqual(after + 60 * 60 * 1000);
    });

    it('should use default duration when not specified', () => {
      const before = Date.now();
      const expirationDate = strategy.getExpirationDate();
      const after = Date.now();

      // Default is 60 minutes
      expect(expirationDate!.getTime()).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
      expect(expirationDate!.getTime()).toBeLessThanOrEqual(after + 60 * 60 * 1000);
    });
  });

  describe('BlockStrategy', () => {
    const strategy = new BlockStrategy();

    it('should have correct type', () => {
      expect(strategy.type).toBe('block');
    });

    it('should not require duration', () => {
      expect(strategy.requiresDuration).toBe(false);
    });

    it('should validate reason with minimum length', () => {
      expect(() =>
        strategy.validate({ ...baseInput, actionType: 'block', reason: 'abc' })
      ).toThrow('O motivo do bloqueio deve ter pelo menos 5 caracteres.');
    });

    it('should accept valid reason', () => {
      expect(() =>
        strategy.validate({ ...baseInput, actionType: 'block', reason: 'Motivo válido' })
      ).not.toThrow();
    });

    it('should return null for expiration date', () => {
      expect(strategy.getExpirationDate()).toBeNull();
    });
  });

  describe('BanStrategy', () => {
    const strategy = new BanStrategy();

    it('should have correct type', () => {
      expect(strategy.type).toBe('ban');
    });

    it('should not require duration', () => {
      expect(strategy.requiresDuration).toBe(false);
    });

    it('should require longer reason (10 chars minimum)', () => {
      expect(() =>
        strategy.validate({ ...baseInput, actionType: 'ban', reason: 'abcdefgh' })
      ).toThrow('O motivo do banimento deve ter pelo menos 10 caracteres.');
    });

    it('should accept valid reason with 10+ characters', () => {
      expect(() =>
        strategy.validate({ ...baseInput, actionType: 'ban', reason: 'Motivo válido para banimento' })
      ).not.toThrow();
    });

    it('should return null for expiration date', () => {
      expect(strategy.getExpirationDate()).toBeNull();
    });
  });

  describe('strategyFactory', () => {
    it('should return WarnStrategy for warn type', () => {
      const strategy = getStrategy('warn');
      expect(strategy.type).toBe('warn');
    });

    it('should return SuspendStrategy for suspend type', () => {
      const strategy = getStrategy('suspend');
      expect(strategy.type).toBe('suspend');
    });

    it('should return BlockStrategy for block type', () => {
      const strategy = getStrategy('block');
      expect(strategy.type).toBe('block');
    });

    it('should return BanStrategy for ban type', () => {
      const strategy = getStrategy('ban');
      expect(strategy.type).toBe('ban');
    });

    it('should throw for unknown strategy type', () => {
      expect(() => getStrategy('unknown' as any)).toThrow(
        'Estratégia de moderação desconhecida: unknown'
      );
    });
  });
});
