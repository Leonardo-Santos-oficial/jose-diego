import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  describe,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  expect,
  it,
  vi,
} from 'vitest';
import { AviatorGameClient } from '@/components/aviator/AviatorGameClient';
import { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element -- Tests stub the optimized component with a basic img tag.
    <img {...props} alt={props.alt ?? 'mock-image'} />
  ),
}));

vi.mock('@/components/aviator/AviatorScene', () => ({
  AviatorScene: () => <div data-testid="aviator-scene" />,
}));

vi.mock('@/components/aviator/AviatorBetPanel', () => ({
  AviatorBetPanel: () => <div data-testid="aviator-bet-panel" />,
}));

vi.mock('@/components/aviator/AviatorHistoryRail', () => ({
  AviatorHistoryRail: () => <div data-testid="aviator-history" />,
}));

vi.mock('@/components/aviator/AviatorSoundtrackToggle', () => ({
  AviatorSoundtrackToggle: ({
    enabled,
    onToggle,
  }: {
    enabled: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <button
      data-testid="soundtrack-toggle"
      aria-pressed={enabled}
      onClick={() => onToggle(!enabled)}
    >
      toggle-soundtrack
    </button>
  ),
}));

const mockController = {
  connect: () => () => undefined,
  toggleMusic: vi.fn(),
  playClick: vi.fn(),
  restoreMusicPreference: vi.fn(),
};

vi.mock('@/modules/aviator/hooks/useAviatorController', () => ({
  useAviatorController: (_userId: string) => mockController,
}));

const originalSetState = useAviatorStore.setState;

const resetStore = () => {
  useAviatorStore.setState({
    state: undefined,
    history: [],
    betResult: undefined,
    cashoutResult: undefined,
    walletSnapshot: undefined,
    musicEnabled: false,
    isConnected: false,
  });
};

const renderGame = async (snapshot?: { balance: number; updatedAt: string }) =>
  act(async () => {
    render(<AviatorGameClient userId="user-1" initialWalletSnapshot={snapshot} />);
    await Promise.resolve();
  });

describe('AviatorGameClient', () => {
  beforeAll(() => {
    useAviatorStore.setState = ((...args) => {
      act(() => {
        originalSetState(...args);
      });
    }) as typeof useAviatorStore.setState;
  });

  afterAll(() => {
    useAviatorStore.setState = originalSetState;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    resetStore();
  });

  it('hydrates the wallet snapshot that comes from the server', async () => {
    await renderGame({ balance: 250, updatedAt: '2025-11-14T10:00:00Z' });

    await waitFor(() =>
      expect(screen.getByText(/Atualizado em 2025-11-14T10:00:00Z/)).toBeInTheDocument()
    );
    expect(screen.getByText(/Saldo projetado/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$/)).toHaveTextContent('R$ 250,00');
  });

  it('updates the HUD when a newer realtime snapshot arrives', async () => {
    await renderGame({ balance: 125, updatedAt: '2025-11-14T09:55:00Z' });

    await act(async () => {
      useAviatorStore.getState().setBetResult({
        roundId: 'round-demo',
        userId: 'user-1',
        ticketId: 'ticket-1',
        status: 'accepted',
        snapshot: { balance: 480, updatedAt: '2025-11-14T10:05:00Z' },
      });
    });

    await waitFor(() =>
      expect(screen.getByText(/Atualizado em 2025-11-14T10:05:00Z/)).toBeInTheDocument()
    );
    expect(screen.getByText(/R\$/)).toHaveTextContent('R$ 480,00');
  });

  it('ignores stale wallet snapshots after a newer update exists', async () => {
    await renderGame({ balance: 600, updatedAt: '2025-11-14T10:10:00Z' });

    await act(async () => {
      useAviatorStore.getState().syncWalletSnapshot({
        balance: 150,
        updatedAt: '2025-11-14T09:00:00Z',
      });
    });

    expect(screen.getByText(/R\$/)).toHaveTextContent('R$ 600,00');
  });
});
