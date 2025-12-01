'use client';

import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import { cn } from '@/components/lib/utils';
import { useChat } from './ChatContext';

export function ChatWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, toggleChat, closeChat } = useChat();

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-24 right-4 md:bottom-4 z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-rose-500 hover:bg-rose-600" : "bg-teal-500 hover:bg-teal-600"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </Button>

      {/* Chat Panel - Responsive modal */}
      <div
        className={cn(
          "fixed z-40 transition-all duration-300 ease-in-out",
          // Mobile: nearly fullscreen but with proper spacing
          "left-2 right-2 bottom-24 top-16",
          "max-h-[calc(100vh-10rem)]",
          // Tablet and up: fixed-width floating panel
          "sm:left-auto sm:right-4 sm:top-auto sm:w-[380px] sm:h-[500px] sm:max-h-[70vh]",
          // Desktop: slightly larger
          "md:bottom-20 md:w-[400px] md:h-[520px]",
          // Animation states
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-white/5 bg-slate-900/50 px-4 py-3">
            <h3 className="font-semibold text-white">Suporte ao Vivo</h3>
            <button 
              onClick={closeChat}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Chat content with proper height constraints */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
