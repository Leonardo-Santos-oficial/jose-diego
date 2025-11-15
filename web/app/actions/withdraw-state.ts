export type WithdrawActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export const withdrawActionInitialState: WithdrawActionState = {
  status: 'idle',
};
