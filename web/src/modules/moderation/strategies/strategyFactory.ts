import type { ModerationStrategy, ModerationActionType } from '../types';
import { WarnStrategy, SuspendStrategy, BlockStrategy, BanStrategy } from './index';

const strategies: Record<ModerationActionType, ModerationStrategy> = {
  warn: new WarnStrategy(),
  suspend: new SuspendStrategy(),
  block: new BlockStrategy(),
  ban: new BanStrategy(),
};

export function getStrategy(type: ModerationActionType): ModerationStrategy {
  const strategy = strategies[type];

  if (!strategy) {
    throw new Error(`Estratégia de moderação desconhecida: ${type}`);
  }

  return strategy;
}
