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
          "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-rose-500 hover:bg-rose-600" : "bg-teal-500 hover:bg-teal-600"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 w-[90vw] max-w-[400px] transition-all duration-300 ease-in-out",
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/50 px-4 py-3">
            <h3 className="font-semibold text-white">Suporte ao Vivo</h3>
            <button 
              onClick={closeChat}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
