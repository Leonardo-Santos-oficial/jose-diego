'use client';

import { useState, useCallback } from 'react';
import { uploadAvatarAction } from '@/app/actions/upload-avatar';
import { uploadFacade, type UploadResult } from '@/modules/upload';

export type AvatarUploadState = {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: UploadResult;
};

export function useAvatarUpload(_userId?: string) {
  const [state, setState] = useState<AvatarUploadState>({
    status: 'idle',
    progress: 0,
  });

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setState({ status: 'uploading', progress: 0 });

      // Client-side validation
      const validation = uploadFacade.validateFile(file, 'avatar');
      if (!validation.valid) {
        setState({
          status: 'error',
          progress: 0,
          error: validation.error,
        });
        return null;
      }

      try {
        setState({ status: 'uploading', progress: 50 });

        // Use Server Action for secure upload
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await uploadAvatarAction(formData);

        if (!result.success || !result.url) {
          throw new Error(result.error || 'Falha no upload.');
        }

        const uploadResult: UploadResult = {
          url: result.url,
          path: result.url,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        };

        setState({
          status: 'success',
          progress: 100,
          result: uploadResult,
        });

        return uploadResult;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao fazer upload.';
        setState({
          status: 'error',
          progress: 0,
          error: message,
        });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0 });
  }, []);

  return { state, upload, reset };
}
