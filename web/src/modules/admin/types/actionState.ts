import type { BalanceAdjustmentResult } from './index';

export type AdminActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  snapshot?: BalanceAdjustmentResult['snapshot'];
};

export const adminActionInitialState: AdminActionState = {
  status: 'idle',
};
