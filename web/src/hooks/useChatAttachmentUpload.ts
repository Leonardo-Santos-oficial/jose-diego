'use client';

import { useState, useCallback } from 'react';
import { uploadChatAttachmentAction } from '@/app/actions/upload-chat-attachment';
import { uploadFacade, type UploadResult, type AttachmentType } from '@/modules/upload';

export type ChatAttachmentUploadState = {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: UploadResult & { attachmentType: AttachmentType };
};

export function useChatAttachmentUpload(_userId?: string, _threadId?: string) {
  const [state, setState] = useState<ChatAttachmentUploadState>({
    status: 'idle',
    progress: 0,
  });

  const upload = useCallback(
    async (file: File): Promise<(UploadResult & { attachmentType: AttachmentType }) | null> => {
      setState({ status: 'uploading', progress: 0 });

      // Client-side validation
      const validation = uploadFacade.validateFile(file, 'chat-attachment');
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
        
        const result = await uploadChatAttachmentAction(formData);

        if (!result.success || !result.url) {
          throw new Error(result.error || 'Falha no upload.');
        }

        const attachmentType = uploadFacade.getAttachmentType(file.type);
        const uploadResult: UploadResult & { attachmentType: AttachmentType } = {
          url: result.url,
          path: result.url,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          attachmentType,
        };

        setState({
          status: 'success',
          progress: 100,
          result: uploadResult,
        });

        return uploadResult;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao fazer upload do anexo.';
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
