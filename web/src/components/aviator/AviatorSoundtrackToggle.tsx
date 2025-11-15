'use client';

import Image from 'next/image';
import { aviatorAssets } from '@/modules/aviator/config/sceneConfig';

export type AviatorSoundtrackToggleProps = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
};

export function AviatorSoundtrackToggle({
  enabled,
  onToggle,
}: AviatorSoundtrackToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => onToggle(!enabled)}
      className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 text-left text-white transition ${enabled ? 'border-teal-300/70 shadow-[0_0_35px_rgba(45,212,191,0.35)]' : 'hover:border-white/20'}`}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Trilha</p>
        <p className="text-lg font-semibold">{enabled ? 'Ligada' : 'Silenciada'}</p>
        <small className="text-xs text-slate-400">
          Music.webm + efeitos Btn/Winer/Loser
        </small>
      </div>
      <Image
        src={aviatorAssets.logo}
        alt="Ícone musical"
        width={72}
        height={32}
        className="opacity-80"
      />
    </button>
  );
}
