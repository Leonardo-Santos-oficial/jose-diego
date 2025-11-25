import type { GameHistoryEntry } from '@/types/aviator';

export const aviatorAssets = {
  background: '/aviator/images/img_bg.png',
  bgDefault: '/aviator/images/bg_default.png',
  curve: '/aviator/images/landscape.png', // Using img_01 as the curve
  cloud1: '/aviator/images/cloud1.png',
  cloud2: '/aviator/images/cloud2.png',
  cloud3: '/aviator/images/cloud3.png',
  plane: '/aviator/images/plane.png',
  hudMoney: '/aviator/images/hud_money-default-000.png',
  hudProgress: '/aviator/images/img_hudprogressbar-default-001.png',
  logo: '/aviator/images/img_logo_3-default-000.png',
  particles: '/aviator/images/particles.png',
  historyBadge: '/aviator/images/history-badge.png',
  ruler: '/aviator/images/img_regua.png',
} as const;

export const aviatorAudio = {
  music: '/aviator/audio/Music.webm',
  click: '/aviator/audio/BTN_Click.webm',
  win: '/aviator/audio/Winer.webm',
  lose: '/aviator/audio/Loser.webm',
} as const;

// Derived from timelines/Timeline 1.json (totalTime = 5s, stepTime = 0.1s)
export const planeLoopDurationMs = 5000;
export const planeLoopStepMs = 100;

export const bucketPalette: Record<GameHistoryEntry['bucket'], string> = {
  blue: '#60a5fa',
  purple: '#c084fc',
  pink: '#f472b6',
};

export const phasePalette = {
  awaitingBets: '#38bdf8',
  flying: '#facc15',
  crashed: '#f87171',
} as const;
