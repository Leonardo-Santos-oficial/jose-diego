import Image from 'next/image';
import { createElement, type ReactElement } from 'react';
import type {
  BetResultMessage,
  CashoutResultMessage,
  GameStateMessage,
  WalletSnapshot,
} from '@/types/aviator';
import { aviatorAssets } from '@/modules/aviator/config/sceneConfig';

export type AviatorHudProps = {
  isConnected: boolean;
  gameState?: GameStateMessage;
  walletSnapshot?: WalletSnapshot;
  betResult?: BetResultMessage;
  cashoutResult?: CashoutResultMessage;
};

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const phaseLabel = (phase?: GameStateMessage['state']) => {
  switch (phase) {
    case 'awaitingBets':
      return 'Aguardando apostas';
    case 'flying':
      return 'Em voo';
    case 'crashed':
      return 'Rodada encerrada';
    default:
      return 'Indisponível';
  }
};

export function AviatorHud({
  isConnected,
  gameState,
  walletSnapshot,
  betResult,
  cashoutResult,
}: AviatorHudProps): ReactElement {
  const autopayoutCount = gameState?.autopayouts?.length ?? 0;
  const bettingWindowMs = gameState?.bettingWindow?.closesInMs;
  const closesIn =
    typeof bettingWindowMs === 'number' ? Math.max(0, bettingWindowMs) : null;

  const el = createElement;

  return el(
    'section',
    {
      className: 'rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-white',
    },
    el(
      'div',
      { className: 'flex items-center justify-between' },
      el(
        'div',
        undefined,
        el(
          'p',
          { className: 'text-sm uppercase tracking-[0.3em] text-slate-400' },
          'Telemetria'
        ),
        el('h3', { className: 'text-2xl font-semibold' }, 'HUD do piloto')
      ),
      el(
        'span',
        {
          className: 'rounded-full px-4 py-1 text-sm font-semibold',
          style: {
            backgroundColor: isConnected
              ? 'rgba(34,197,94,0.15)'
              : 'rgba(248,113,113,0.15)',
            color: isConnected ? '#4ade80' : '#f87171',
          },
        },
        isConnected ? 'Conectado ao loop' : 'Offline'
      )
    ),
    el(
      'div',
      {
        className:
          'mt-4 grid gap-3 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:grid-cols-3',
      },
      el(HudIndicator, {
        label: 'Fase atual',
        value: phaseLabel(gameState?.state),
        tone: 'teal',
      }),
      el(HudIndicator, {
        label: 'Mult x',
        value: `${(gameState?.multiplier ?? 1).toFixed(2)}x`,
        tone: 'violet',
      }),
      el(HudIndicator, {
        label: 'Autopayouts',
        value: autopayoutCount > 0 ? `${autopayoutCount} ativos` : 'Nenhum ativo',
        tone: 'amber',
      })
    ),
    closesIn !== null
      ? el(
          'p',
          { className: 'mt-2 text-xs text-slate-400' },
          `Janela de apostas encerra em ${(closesIn / 1000).toFixed(1)}s`
        )
      : null,
    el(
      'div',
      { className: 'mt-5 grid gap-4 md:grid-cols-3' },
      el(
        'div',
        {
          className:
            'relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/60 p-4',
        },
        el(Image, {
          src: aviatorAssets.hudMoney,
          alt: 'Decoração de saldo',
          width: 180,
          height: 140,
          className: 'pointer-events-none absolute -right-4 bottom-0 opacity-50',
        }),
        el('p', { className: 'text-sm text-slate-300' }, 'Saldo projetado'),
        el(
          'p',
          { className: 'text-3xl font-semibold text-emerald-300' },
          currency.format(walletSnapshot?.balance ?? 0)
        ),
        el(
          'p',
          { className: 'text-xs text-slate-400' },
          `Atualizado em ${walletSnapshot?.updatedAt ?? '—'}`
        )
      ),
      el(HudCard, {
        title: 'Última aposta',
        status:
          betResult?.status === 'accepted' ? 'success' : betResult ? 'error' : 'idle',
        description: betResult
          ? `Ticket ${betResult.ticketId ?? '—'}`
          : 'Sem apostas recentes',
        footer: betResult ? `Usuário ${betResult.userId}` : 'Aguardando',
        testId: 'aviator-hud-last-bet',
      }),
      el(HudCard, {
        title: 'Cashout',
        status:
          cashoutResult?.status === 'credited'
            ? 'success'
            : cashoutResult
              ? 'error'
              : 'idle',
        description:
          cashoutResult?.status === 'credited'
            ? `${currency.format(cashoutResult.creditedAmount ?? 0)} @ ${cashoutResult.cashoutMultiplier ?? 0}x`
            : cashoutResult?.reason ?? 'Sem cashouts',
        footer: cashoutResult ? `Ticket ${cashoutResult.ticketId}` : 'Nenhum registro',
        testId: 'aviator-hud-last-cashout',
      })
    )
  );
}

type HudCardProps = {
  title: string;
  status: 'success' | 'error' | 'idle';
  description: string;
  footer: string;
  testId?: string;
};

function HudCard({ title, status, description, footer, testId }: HudCardProps) {
  const palette = {
    success: '#4ade80',
    error: '#f87171',
    idle: '#94a3b8',
  };

  return createElement(
    'div',
    {
      className: 'rounded-xl border border-white/5 bg-slate-900/60 p-4',
      'data-testid': testId,
    },
    createElement('p', { className: 'text-sm text-slate-300' }, title),
    createElement(
      'p',
      { className: 'text-lg font-semibold', style: { color: palette[status] } },
      description
    ),
    createElement('p', { className: 'text-xs text-slate-500' }, footer)
  );
}

type HudIndicatorProps = {
  label: string;
  value: string;
  tone: 'teal' | 'violet' | 'amber';
};

function HudIndicator({ label, value, tone }: HudIndicatorProps) {
  const toneMap = {
    teal: 'bg-teal-500/10 text-teal-200 border-teal-500/40',
    violet: 'bg-violet-500/10 text-violet-200 border-violet-500/40',
    amber: 'bg-amber-500/10 text-amber-200 border-amber-500/40',
  } as const;

  return createElement(
    'div',
    {
      className: `rounded-lg border px-3 py-2 text-[11px] leading-tight ${toneMap[tone]}`,
      'data-testid': `aviator-indicator-${tone}`,
    },
    createElement(
      'span',
      {
        className:
          'block text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400',
      },
      label
    ),
    createElement(
      'span',
      {
        className: 'mt-1 block text-base normal-case tracking-normal text-white',
      },
      value
    )
  );
}
