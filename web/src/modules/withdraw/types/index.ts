export type WithdrawStatus = 'pending' | 'approved' | 'rejected';

export type WithdrawRequest = {
  id: string;
  userId: string;
  amount: number;
  status: WithdrawStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateWithdrawInput = {
  userId: string;
  amount: number;
};

export type UpdateWithdrawStatusInput = {
  id: string;
  status: Exclude<WithdrawStatus, 'pending'>;
};
