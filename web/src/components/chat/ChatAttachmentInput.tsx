'use client';

import { useRef, useState, useCallback } from 'react';
import { Paperclip, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import type { AttachmentType } from '@/modules/upload';

interface ChatAttachmentInputProps {
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  previewUrl?: string | null;
  previewType?: AttachmentType | null;
  previewName?: string | null;
  onClearPreview?: () => void;
  disabled?: boolean;
}

export function ChatAttachmentInput({
  isUploading,
  onFileSelect,
  previewUrl,
  previewType,
  previewName,
  onClearPreview,
  disabled = false,
}: ChatAttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [disabled, isUploading, onFileSelect]
  );

  if (previewUrl && previewType) {
    return (
      <div className="relative inline-flex items-center gap-2 p-2 bg-slate-800/60 rounded-lg border border-white/10">
        {previewType === 'image' ? (
          <div className="relative w-16 h-16 rounded overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span className="text-sm text-white truncate max-w-[150px]">
              {previewName || 'Documento'}
            </span>
          </div>
        )}

        {isUploading ? (
          <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
        ) : (
          onClearPreview && (
            <button
              type="button"
              onClick={onClearPreview}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Remover anexo"
            >
              <X className="w-3 h-3" />
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative',
        isDragging && 'ring-2 ring-teal-400/50 rounded'
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          'p-2 rounded-lg transition-colors',
          disabled || isUploading
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-400 hover:text-teal-400 hover:bg-slate-800/60'
        )}
        aria-label="Anexar arquivo"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
}
