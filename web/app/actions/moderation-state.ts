export type ModerationActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export const moderationActionInitialState: ModerationActionState = { status: 'idle' };
