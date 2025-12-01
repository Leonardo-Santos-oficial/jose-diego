'use client';

import { useState } from 'react';
import { AviatorBetPanel, type AviatorBetPanelProps } from './AviatorBetPanel';
import { Button } from '@/components/components/ui/button';
import { cn } from '@/components/lib/utils';

export function AviatorBettingArea(props: AviatorBetPanelProps) {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  return (
    <div className="space-y-4">
      {/* Mobile Tabs */}
      <div className="flex rounded-xl bg-slate-900/50 p-1 lg:hidden">
        <button
          onClick={() => setActiveTab(0)}
          className={cn(
            'flex-1 rounded-lg py-3 min-h-[44px] text-base font-medium transition',
            activeTab === 0
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          Aposta 1
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={cn(
            'flex-1 rounded-lg py-3 min-h-[44px] text-base font-medium transition',
            activeTab === 1
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          Aposta 2
        </button>
      </div>

      {/* Panels */}
      <div className="grid gap-4 lg:grid-cols-1">
        <div className={cn('lg:block', activeTab === 0 ? 'block' : 'hidden')}>
          <AviatorBetPanel {...props} key="panel-1" />
        </div>
        <div className={cn('lg:block', activeTab === 1 ? 'block' : 'hidden')}>
          <AviatorBetPanel {...props} key="panel-2" initialAutoCashoutPreference={false} />
        </div>
      </div>
    </div>
  );
}
