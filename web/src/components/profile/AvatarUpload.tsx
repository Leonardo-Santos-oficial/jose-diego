'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Loader2, X, User } from 'lucide-react';
import { cn } from '@/components/lib/utils';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  displayName: string;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  isUploading,
  onFileSelect,
  onRemove,
  error,
  size = 'lg',
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

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
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-full cursor-pointer transition-all duration-200 group',
          sizeClasses[size],
          isDragging && 'ring-4 ring-[#E31C58]/50',
          isUploading && 'opacity-70 cursor-wait'
        )}
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={displayName}
            className="w-full h-full object-cover rounded-full border-2 border-[#E31C58]/50"
          />
        ) : (
          <div className="w-full h-full rounded-full border-2 border-[#E31C58]/50 bg-gradient-to-br from-[#E31C58] to-[#FF6B6B] flex items-center justify-center">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
        )}

        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity duration-200',
            isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className={cn('text-white animate-spin', iconSizeClasses[size])} />
          ) : (
            <Camera className={cn('text-white', iconSizeClasses[size])} />
          )}
        </div>

        {currentAvatarUrl && onRemove && !isUploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Remover foto"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Clique ou arraste para alterar
      </p>

      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
