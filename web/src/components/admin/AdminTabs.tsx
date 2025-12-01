'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/components/lib/utils';

export interface AdminTabConfig {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface AdminTabsProps {
  tabs: AdminTabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function AdminTabs({ tabs, activeTab, onTabChange }: AdminTabsProps) {
  return (
    <nav className="-mx-4 px-4 flex gap-1 overflow-x-auto border-b border-slate-800/60 pb-px scrollbar-thin scrollbar-thumb-slate-700 md:mx-0 md:px-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm',
            activeTab === tab.id
              ? 'border-b-2 border-teal-400 bg-slate-900/60 text-teal-300'
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
          )}
        >
          {tab.icon}
          <span className="hidden xs:inline sm:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

interface AdminTabPanelProps {
  isActive: boolean;
  children: ReactNode;
}

export function AdminTabPanel({ isActive, children }: AdminTabPanelProps) {
  if (!isActive) return null;
  return <div className="pt-4 sm:pt-6">{children}</div>;
}
