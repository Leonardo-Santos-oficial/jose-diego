'use client';

import { Volume2, VolumeX } from 'lucide-react';

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
      className={`flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors md:h-9 md:w-9 ${
        enabled 
          ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      }`}
      title={enabled ? 'Silenciar' : 'Ativar som'}
    >
      {enabled ? <Volume2 className="h-5 w-5 md:h-4 md:w-4" /> : <VolumeX className="h-5 w-5 md:h-4 md:w-4" />}
    </button>
  );
}
