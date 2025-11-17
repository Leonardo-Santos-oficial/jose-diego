export type ProfileActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export function createInitialProfileActionState(): ProfileActionState {
  return { status: 'idle' };
}
