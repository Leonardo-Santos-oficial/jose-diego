export type AdminUserSummary = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  displayName?: string | null;
  balance: number;
  walletUpdatedAt?: string | null;
};

export type BalanceAdjustmentInput = {
  userId: string;
  delta: number;
  reason?: string;
};

export type BalanceAdjustmentResult = {
  success: boolean;
  message: string;
  snapshot?: {
    balance: number;
    updatedAt: string;
  };
};
