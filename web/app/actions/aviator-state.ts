export type AviatorActionStatus = 'idle' | 'success' | 'error';

export interface AviatorActionState<TData = unknown> {
  status: AviatorActionStatus;
  message?: string;
  data?: TData;
}

export const initialAviatorActionState: AviatorActionState = { status: 'idle' };

export function createInitialAviatorActionState<
  TData = unknown,
>(): AviatorActionState<TData> {
  return { status: 'idle' };
}
