'use client';

import { useState } from 'react';
import { ExternalLink, X, FileText, Download } from 'lucide-react';

interface ImageAttachmentViewerProps {
  attachmentUrl: string;
  attachmentName?: string;
}

export function ImageAttachmentViewer({
  attachmentUrl,
  attachmentName,
}: ImageAttachmentViewerProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // If image failed to load, show document fallback
  if (imageError) {
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-3 p-3 rounded-lg border transition-colors bg-slate-700/50 border-slate-600/30 hover:bg-slate-700/70"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-600/50">
          <FileText className="w-5 h-5 text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {attachmentName || 'Imagem'}
          </p>
          <p className="text-xs text-slate-400">
            Clique para abrir
          </p>
        </div>
        <Download className="w-4 h-4 flex-shrink-0 text-slate-400" />
      </a>
    );
  }

  return (
    <>
      <div className="mt-2 max-w-[280px]">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="block w-full rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-colors"
        >
          <img
            src={attachmentUrl}
            alt={attachmentName || 'Imagem anexada'}
            className="w-full h-auto max-h-[200px] object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </button>
      </div>

      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={attachmentUrl}
            alt={attachmentName || 'Imagem em tamanho completo'}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir original
          </a>
        </div>
      )}
    </>
  );
}
