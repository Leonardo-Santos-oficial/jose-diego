'use client';

import dynamic from 'next/dynamic';
import { FileText, Download } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import type { AttachmentType } from '@/modules/chat/types';

interface ChatMessageAttachmentProps {
  attachmentUrl: string;
  attachmentType: AttachmentType;
  attachmentName?: string;
  isOwnMessage: boolean;
}

// Dynamic import for the image viewer to avoid hydration issues
const ImageAttachmentViewer = dynamic(
  () => import('./ImageAttachmentViewer').then((mod) => mod.ImageAttachmentViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="mt-2 max-w-[280px] h-[150px] rounded-lg bg-slate-800/50 animate-pulse" />
    )
  }
);

export function ChatMessageAttachment({
  attachmentUrl,
  attachmentType,
  attachmentName,
  isOwnMessage,
}: ChatMessageAttachmentProps) {
  // Image attachment - use client-only component
  if (attachmentType === 'image') {
    return (
      <ImageAttachmentViewer
        attachmentUrl={attachmentUrl}
        attachmentName={attachmentName}
      />
    );
  }

  // Document attachment
  return (
    <a
      href={attachmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mt-2 flex items-center gap-3 p-3 rounded-lg border transition-colors',
        isOwnMessage
          ? 'bg-teal-600/20 border-teal-500/30 hover:bg-teal-600/30'
          : 'bg-slate-700/50 border-slate-600/30 hover:bg-slate-700/70'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        isOwnMessage ? 'bg-teal-500/30' : 'bg-slate-600/50'
      )}>
        <FileText className={cn(
          'w-5 h-5',
          isOwnMessage ? 'text-teal-300' : 'text-slate-300'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {attachmentName || 'Documento'}
        </p>
        <p className="text-xs text-slate-400">
          Clique para abrir
        </p>
      </div>
      <Download className={cn(
        'w-4 h-4 flex-shrink-0',
        isOwnMessage ? 'text-teal-300' : 'text-slate-400'
      )} />
    </a>
  );
}
