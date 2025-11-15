import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

type UseActionStateShim = NonNullable<(typeof import('react'))['useActionState']>;

const createUseActionStateShim = (actual: typeof import('react')): UseActionStateShim => {
  return ((action: (...args: unknown[]) => unknown, initialState: unknown) => {
    const [state, setState] = actual.useState(initialState);
    const [isPending, setIsPending] = actual.useState(false);
    const stateRef = actual.useRef(state);
    stateRef.current = state;

    const formAction = actual.useCallback(
      async (payload: unknown) => {
        setIsPending(true);
        try {
          const nextState = await action(stateRef.current, payload);
          setState(nextState);
          stateRef.current = nextState;
        } finally {
          setIsPending(false);
        }
      },
      [action]
    );

    return [state, formAction, isPending] as ReturnType<UseActionStateShim>;
  }) as UseActionStateShim;
};

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  if (typeof actual.useActionState === 'function') {
    return actual;
  }

  return {
    ...actual,
    useActionState: createUseActionStateShim(actual),
  } satisfies typeof actual;
});

vi.mock('react-dom/test-utils', async () => {
  const actual =
    await vi.importActual<typeof import('react-dom/test-utils')>('react-dom/test-utils');
  const react = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    act: react.act,
  };
});
