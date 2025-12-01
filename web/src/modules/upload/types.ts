export type UploadDestination = 'avatar' | 'chat-attachment';

export type AttachmentType = 'image' | 'document';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface UploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  bucket: string;
  pathPrefix: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const UPLOAD_CONFIGS: Record<UploadDestination, UploadConfig> = {
  avatar: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    bucket: 'avatars',
    pathPrefix: 'users',
  },
  'chat-attachment': {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ],
    bucket: 'chat-attachments',
    pathPrefix: 'threads',
  },
};
