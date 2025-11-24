'use client';

import { useState } from 'react';
import { Button } from '@/components/components/ui/button';
import { useChat } from '@/components/chat/ChatContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/components/ui/dialog';

interface DepositDialogProps {
  children: React.ReactNode;
}

export function DepositDialog({ children }: DepositDialogProps) {
  const [open, setOpen] = useState(false);
  const { openChat } = useChat();

  const handleConfirm = () => {
    setOpen(false);
    // Small delay to ensure dialog closes smoothly before chat opens
    setTimeout(() => {
      openChat();
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-slate-50">
        <DialogHeader>
          <DialogTitle>Depósito Simulado</DialogTitle>
          <DialogDescription className="text-slate-400">
            Para realizar um depósito simulado, entre em contato com o suporte através do chat no canto inferior direito.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            Entendi, abrir chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
